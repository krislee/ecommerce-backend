require("dotenv").config()
const stripe = require("stripe")(`${process.env.STRIPE_SECRET}`)
const LoggedInCart = require('../../model/buyer/cart')
const LoggedInUser = require('../../model/buyer/buyerUser')
const CachePaymentIntent = require('../../model/seller/cachePaymentIntent')

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
// Customer obj stores details on the customer (name, email, shipping address, etc.)
// Customer obj used to store customer's card info in the payment intent
const customer = async (req, res) => { // need to passportAuthenticate this controller
  if (req.user) {
    const loggedInUser = await LoggedInUser.findById(req.user._id)

    // Check if the logged in user already has a customer object made. If there has not been any record of a customer object, then make a customer and add it to the database. 
    if(!loggedInUser.customer) {
      const customer = await stripe.customers.create(); 
      console.log("customer: ", customer)

      await LoggedInUser.findOneAndUpdate({_id: req.user._id}, {customer: customer.id}, {new: true})

      const loggedInUser = await LoggedInUser.findById(req.user._id) // delete this after it works - it is just for console logging
      console.log("logged in user with customer object: ", loggedInUser)

      return customer.id
    } else {
      console.log(loggedInUser.customer)
      return loggedInUser.customer
    }
  }
}

// Click Checkout and create only ONE payment intent for each unpaid cart
const createPaymentIntent = async(req, res) => {

  const existingPaymentIntent = await CachePaymentIntent.findOne({Idempotency: req.headers['Idempotency-Key']})
  console.log("existingPaymentIntent: ", existingPaymentIntent)

  // If payment intent has already been created, update the payment intent's amount parameter to ensure the amount is the most current.
  // If payment intent has not been created, create a new payment intent with the customer id if user is logged in
  if (existingPaymentIntent) {

    // Retreive the payment intent Id to update the payment intent
    const {paymentIntentId} = req.body
    console.log("paymentIntentId from req.body: ", paymentIntentId)

    if (req.user) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId) 
      console.log("existing payment intent for logged in user: ", paymentIntent)

      const paymentIntentCustomer = paymentIntentId.customer
      console.log("check if there is customer in payment Intent: ", paymentIntentCustomer)
    
      // If logged in user did not have the customer property because guest user clicked Checkout, which made a payment Intent and then went back and logged in, and then continued checking out, we want to create a new customer object or retreive an existing customer object for the just logged in customer.
      if(!paymentIntentCustomer) {

        // Note: Can NOT update payment intent after confirming payment intent successfully
        await stripe.paymentIntents.update(paymentIntentId, {
          amount: calculateOrderAmount(),
          customer: customer()
        })
      }
    } else {
      await stripe.paymentIntents.update(paymentIntentId, {
        amount: calculateOrderAmount()
      })
    }
    
  } else {
    if(req.user) {
      console.log("user is logged in, create payment intent")

      // id of logged in customer's cart will be the idempotent key in payment intent creation
      const loggedInCart = await LoggedInCart.findOne({LoggedInBuyer: req.user._id})

      // customer helper will return customer obj id
      const customer = customer()
      console.log("customer obj's id: ", customer)

      // Create a PaymentIntent with the order amount, currency,
      // customer's id and off_session for setup_future_usage to store customer's card info
      // customer's card details is auto attached in a PaymentMethod obj to customer obj after PaymentIntent succeeds
      const paymentIntent = await stripe.paymentIntents.create({
        customer: customer,
        setup_future_usage: 'off_session',
        amount: calculateOrderAmount(),
        currency: "usd"
      }, {
        idempotencyKey: loggedInCart._id
      });
      
      // store the created payment intent's id as the value to the idempotent key in cachePaymentIntent
      await CachePaymentIntent.create({
        Customer: customer,
        Idempotency: req.headers['Idempotency-Key'],
        PaymentIntentId: paymentIntent.id
      })

      res.status(200).json({
        publicKey: process.env.STRIPE_PUBLIC,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret
      });
    } else {
      console.log("user not logged in, create payment intent")

      console.log(req.sessionID, "guest cart's id")
      
      // if user is not logged in, do not create a payment intent with customer property
      const paymentIntent = await stripe.paymentIntents.create({
        amount: calculateOrderAmount(),
        currency: "usd"
      }
      // , {
      //   idempotencyKey: req.sessionID // use the guest cart's ID (which is from express-session)
      // }
      );
      await CachePaymentIntent.create({
        Idempotency: req.headers['Idempotency-Key'],
        PaymentIntentId: req.sessionID
      })

      res.status(200).json({
        publicKey: process.env.STRIPE_PUBLIC,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret
      });
    }
  }
}





















// When you're ready to charge the card again, create a new PaymentIntent with the Customer ID, the PaymentMethod ID of the card you want to charge, and set the off_session and confirm flags to true.
const chargeCustomer = async (req, res, customerId) => {
  if(req.user) {
    // Lookup the payment methods available for the customer
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card"
    });
  
    // Charge the customer and payment method immediately
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1099,
      currency: "usd",
      customer: customerId,
      payment_method: paymentMethods.data[0].id,
      off_session: true,
      confirm: true
    });
  
    if (paymentIntent.status === "succeeded") {
      console.log("✅ Successfully charged card off session");
    }
  }
}


module.exports = {publicKey, createPaymentIntent, chargeCustomer}

// payment intent succeed webhook: make an order, delete cart, email receipt
// payment intent process webhook (happens when payment methods have delayed notification.): pending order and then if the payment intent status turns to succeed or requires payment method (the event is payment_intent.payment_failed), then do certain actions
// FghzRFaNnXzeqqYtaIWI-EsvklyguAkx
// add the statement_descriptor to payment intent with Date.now()