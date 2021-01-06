require("dotenv").config()
const stripe = require("stripe")(`${process.env.STRIPE_SECRET}`)
const LoggedInCart = require('../../model/buyer/cart')

const publicKey = (req, res) => {
  try {
    res.status(200).json({publicKey: process.env.STRIPE_PUBLIC})
  }
  catch (error) {
    res.status(400).send(error);
  }
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

const createPaymentIntent = async(req, res) => {
  if(req.user) {
    console.log("user is logged in, create payment intent")

    // id of logged in customer's cart will be the idempotent key
    const loggedInCart = LoggedInCart.findOne({LoggedInBuyer: req.user._id})

    // Create a Customer obj to store details on the customer (name, email, shipping address, etc.)
    // Customer obj used to store customer's card info in the payment intent
    const customer = await stripe.customers.create();

    // Create a PaymentIntent with the order amount and currency
    // and customer's id and off_session for setup_future_usage to store customer's card info
    // customer's card details is auto attached in a PaymentMethod obj to customer obj after PaymentIntent succeeds
    const paymentIntent = await stripe.paymentIntents.create({
      customer: customer.id,
      setup_future_usage: 'off_session',
      amount: calculateOrderAmount(),
      currency: "usd",

    }, {
      idempotencyKey: loggedInCart._id
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret
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

    res.status(200).json({
      clientSecret: paymentIntent.client_secret
    });
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

