require("dotenv").config()
const stripe = require("stripe")(`${process.env.STRIPE_SECRET}`)
const LoggedInCart = require('../../model/buyer/cart')
const LoggedInUser = require('../../model/buyer/buyerUser')
const CachePaymentIntent = require('../../model/buyer/cachePaymentIntent')

const indexPaymentMethods = async(req, res) => {
  const loggedInUser = await LoggedInUser.findById(req.user._id)

  const paymentMethods = await stripe.paymentMethods.list({
    customer: loggedInUser.customer, // customer's id stored in found BuyerUser's document
    type: 'card',
  });

  
}

const defaultPaymentMethod = async(req, res) => {
  const loggedInUser = await LoggedInUser.findById(req.user._id)
}

// Helper function calculates cart total price
const calculateOrderAmount = (req, res) => {
  // let totalCartPrice = 0

  // if(req.user) {
  //   const loggedInCart = LoggedInCart.findOne({LoggedInBuyer: req.user._id})

  //   for(let i=0; i<loggedInCart.Items.length; i++) {
  //     totalCartPrice+= loggedInCart.Items.TotalPrice
  //   }

  // } else { 
  //   const guestCart = req.session.cart

  //   for(let i=0; i<guestCart.length; i++) {
  //     totalCartPrice += guestCart.TotalPrice
  //   }
  // }

  // return totalCartPrice *=100 // total cart price in cents
  return 1400
}

// Click Checkout and create customer ONCE. Only need one customer object to be made for any future payments. 
// Customer obj stores details on the customer (name, email, shipping address, etc.) and the customer's card info in the payment intent
const customer = async (req, res) => { // need to passportAuthenticate this controller
  if (req.user) {
    const loggedInUser = await LoggedInUser.findById(req.user._id)

    // Check if the logged in user already has a customer object made. 
    // If there has not been any record of a customer object, then make a customer and add it to customer field of a BuyerUser document. 
    // If customer has already been made, then retrieve the customer id from the customer field of BuyerUser document.
    if(!loggedInUser.customer) {
      const customer = await stripe.customers.create({metadata: {last_used_payment: null}}); 
      console.log("customer: ", customer)

      await LoggedInUser.findOneAndUpdate({_id: req.user._id}, {customer: customer.id}, {new: true})

      const loggedInUser = await LoggedInUser.findById(req.user._id) // delete this after it works - it is just for console logging
      console.log("logged in user with customer object: ", loggedInUser)

      return {newCustomer: true, customerId: customer.id}
    } else {
      console.log(loggedInUser.customer)
      return {newCustomer: false, customerId: loggedInUser.customer}
    }
  }
}

// Click Checkout leads to either create only ONE payment intent for each unpaid cart or updating existing payment intent
const createPaymentIntent = async(req, res) => {
  try {
    // If payment intent has already been created, update the payment intent's amount parameter to ensure the amount is the most current.
    // If payment intent has not been created, create a new payment intent with the customer id if user is logged in
    const existingPaymentIntent = await CachePaymentIntent.findOne({Idempotency: req.headers['Idempotency-Key']})
    console.log("existingPaymentIntent: ", existingPaymentIntent)

    if (existingPaymentIntent) {

      // Retrieve the payment intent ID to update the payment intent
      const {paymentIntentId} = req.body
      console.log("paymentIntentId from req.body: ", paymentIntentId)
      
      // Guest has already made a payment intent by clicking checking out but then stopped checkout to log in for the very first time. Therefore, payment intent needs to be updated to also include the customer obj.
      const {newCustomer, customerId} = customer()

      let updatedPaymentIntent

      if(newCustomer) {
        updatedPaymentIntent = await stripe.paymentIntents.update(paymentIntentId, {
          amount: calculateOrderAmount(),
          customer: customerId
        })
      } else {
        updatedPaymentIntent = await stripe.paymentIntents.update(paymentIntentId, {
          amount: calculateOrderAmount()
        })
      }
      
      res.status(200).json({
        publicKey: process.env.STRIPE_PUBLIC,
        // paymentIntentId: updatedPaymentIntent.id,
        clientSecret: updatedPaymentIntent.client_secret
      });

    } else {
      if(req.user) {
        console.log("user is logged in, create payment intent")

        // id of logged in customer's cart will be the idempotent key in payment intent creation
        const loggedInCart = await LoggedInCart.findOne({LoggedInBuyer: req.user._id})

        // customer helper will return customer obj id
        const {newCustomer, customerId} = customer()
        console.log("customer obj's id: ", customerId)
        console.log("newCustomer: ", newCustomer)
       
        let paymentIntent

        // Create a PaymentIntent with the order amount and currency params
        // For first-time purchasing customers, include also the customer's id and off_session for setup_future_usage params to store customer's card info so that
        // card details are auto attached in a PaymentMethod obj to customer obj after PaymentIntent succeeds
        // We only need to attach the card details to the customer object for future purchases ONCE
        if(newCustomer) {
          paymentIntent = await stripe.paymentIntents.create({
            customer: customerId,
            setup_future_usage: 'off_session', // test on_session too with different cards
            amount: calculateOrderAmount(),
            currency: "usd"
          }, {
            idempotencyKey: loggedInCart._id
          });
        } else {
          // If customer object has already been created once for the logged in user, then when the logged in user checks out the user will just be charged on the saved card. 

          // One way:
            // First, lookup the payment methods available for the customer
            // Depending on which payment method is selected by the customer, # in data[#] will be for it. 0 for # will be the default payment method.
            // const paymentMethods = await stripe.paymentMethods.list({
            //   customer: customerId,
            //   type: "card"
            // });
          
          // 2nd way: 
          const customer = await stripe.customers.retrieve(customerId)

        
          // You can charge the customer immediately by confirming payment intent immediately by setting confirm: true. But we will confirm payment intent on client side, so do not set confirm: true.
          paymentIntent = await stripe.paymentIntents.create({
            amount: calculateOrderAmount(),
            currency: "usd",
            customer: customerId,
            payment_method: customer.invoice_settings[default_payment_method], // paymentMethods.data[0].id
            off_session: true, 
          }, {
            idempotencyKey: loggedInCart._id
          });
        }
        
        console.log("creating payment intent for logged in user ", paymentIntent)

        // store the created payment intent's id & the idempotent key in CachePaymentIntent database
        await CachePaymentIntent.create({
          Customer: customerId,
          Idempotency: req.headers['Idempotency-Key'],
          PaymentIntentId: paymentIntent.id
        })

        res.status(200).json({
          publicKey: process.env.STRIPE_PUBLIC,
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          returningCustomer: newCustomer ? !newCustomer : newCustomer,
          customer: true
        });
      } else {
        console.log("user not logged in, create payment intent")

        console.log(req.sessionID, "guest cart's id")
        
        // if user is not logged in, do not create a payment intent with customer property
        const paymentIntent = await stripe.paymentIntents.create({
          amount: calculateOrderAmount(),
          currency: "usd"
        }, {
          idempotencyKey: req.sessionID // use the guest cart's ID (which is from express-session)
        });

        console.log("creating payment intent for guest user ", paymentIntent)

        await CachePaymentIntent.create({
          Idempotency: req.headers['Idempotency-Key'],
          PaymentIntentId: req.sessionID
        })

        res.status(200).json({
          publicKey: process.env.STRIPE_PUBLIC,
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          returningCustomer: false,
          customer: false
        });
      }
    }
  } 
  catch(error) {
    console.log("error: ", error)

  //   if(error.code == "authentication_required") {
  //     res.send({
  //       error: "authentication_required",
  //       paymentMethod: error.raw.payment_method.id,
  //       clientSecret: error.raw.payment_intent.client_secret,
  //       publicKey: process.env.STRIPE_PUBLIC,
  //       amount: calculateOrderAmount(),
  //       card: {
  //         brand: error.raw.payment_method.card.brand,
  //         last4: error.raw.payment_method.card.last4
  //       }
  //     })
  //   } else if (error.code) {
  //     res.send({
  //       error: error.code,
  //       clientSecret: error.raw.payment_intent.client_secret,
  //       publicKey: process.env.STRIPE_PUBLIC,
  //     })
  //   } else {
  //     console.log("Unknown error occurred")
  //   }
  }
}

module.exports = {createPaymentIntent}

/* payment intent succeed webhook: 
- make an order
- delete cart
- email receipt 
- update quantity of selled items */

// payment intent process webhook (happens when payment methods have delayed notification.): pending order and then if the payment intent status turns to succeed or requires payment method (the event is payment_intent.payment_failed), then do certain actions

// add the statement_descriptor to payment intent with Date.now()