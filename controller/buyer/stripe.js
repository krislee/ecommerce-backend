require("dotenv").config()
const stripe = require("stripe")(process.env.STRIPE_SESSION)
const LoggedInCart = require('../../model/buyer/cart')

// Helper function calculates cart total price
const calculateOrderAmount = () => {
  let totalCartPrice = 0

  if(req.user) {
    const loggedInCart = LoggedInCart.findOne({LoggedInBuyer: req.user._id})

    for(let i=0; i<loggedInCart.Items.length; i++) {
      totalCartPrice+= loggedInCart.Items.TotalPrice
    }

  } else { 
    const guestCart = req.session.cart

    for(let i=0; i<guestCart.length; i++) {
      totalCartPrice += guestCart.TotalPrice
    }
  }

  return totalCartPrice *=100 // total cart price in cents
}

// When you're ready to charge the card again, create a new PaymentIntent with the Customer ID, the PaymentMethod ID of the card you want to charge, and set the off_session and confirm flags to true.
const chargeCustomer = async (customerId) => {
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
const createPaymentIntent = async(req, res) => {

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
    currency: "usd"
  });

  res.status(200).json({
    clientSecret: paymentIntent.client_secret
  });
}

module.exports = {createPaymentIntent, chargeCustomer}