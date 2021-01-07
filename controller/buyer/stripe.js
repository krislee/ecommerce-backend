require("dotenv").config()
const stripe = require("stripe")(`${process.env.STRIPE_SECRET}`)
const LoggedInCart = require('../../model/buyer/cart')
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

const createPaymentIntent = async(req, res) => {

  // const existingPaymentIntent = cachePaymentIntents[req.headers['Idempotency-Key']]
  const existingPaymentIntent = await CachePaymentIntent.findOne({Idempotency: req.headers['Idempotency-Key']})

  // If payment intent has already been created, update the payment intent to ensure the amount is the most current
  // If payment intent has not been created, create a new payment intent with the customer id if user is logged in
  if (existingPaymentIntent) {

    // Retreive the payment intent Id to update the payment intent
    const {paymentIntentId} = req.body

    // Update payment intent's amount 

    if (req.user) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId) 
      const customer = paymentIntentId.customer

      // If logged in user did not have the customer property because guest user clicked Checkout, which made a payment Intent and then went back and logged in, and then continued checking out, we want to make a customer object for the newly logged in customer and update the payment intent with the new customer and new amount
      if(!customer) {

        const customer = await stripe.customers.create(); // ?????????????????????????

        await stripe.paymentIntents.update(paymentIntentId, {
          amount: calculateOrderAmount(),
          customer: customer.id
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

      // Create a Customer obj to store details on the customer (name, email, shipping address, etc.)
      // Customer obj used to store customer's card info in the payment intent
      const customer = await stripe.customers.create();

      // Create a PaymentIntent with the order amount, currency,
      // customer's id and off_session for setup_future_usage to store customer's card info
      // customer's card details is auto attached in a PaymentMethod obj to customer obj after PaymentIntent succeeds
      const paymentIntent = await stripe.paymentIntents.create({
        customer: customer.id,
        setup_future_usage: 'off_session',
        amount: calculateOrderAmount(),
        currency: "usd"
      }, {
        idempotencyKey: loggedInCart._id
      });

      console.log(customer, "stripe customer")
      
      // store the created payment intent's id as the value to the idempotent key in cachePaymentIntent
      await CachePaymentIntent.create({
        Customer: customer.id,
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