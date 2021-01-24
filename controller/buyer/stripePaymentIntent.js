require("dotenv").config()
const { v4: uuidv4 } = require('uuid');
const stripe = require("stripe")(`${process.env.STRIPE_SECRET}`)
const LoggedInCart = require('../../model/buyer/cart')
const LoggedInUser = require('../../model/buyer/buyerUser')
const CachePaymentIntent = require('../../model/buyer/cachePaymentIntent')
const {checkoutPaymentMethod} = require('./stripePaymentMethod')

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

// Click Checkout and create customer ONCE by customer() helper. Only need one customer object to be made for any future payments. 
// Customer obj stores details on the customer (name, email, shipping address, etc.) and the customer's card info in the payment intent
const customer = async (req, res) => { // need to passportAuthenticate this controller
    console.log(34)
    if(req.headers.authorization) {
        if (req.user) {
            const loggedInUser = await LoggedInUser.findById(req.user._id)
            console.log(37)
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
}

const updateExistingPaymentIntent = async(existingPaymentIntent) => {
    // Retrieve the payment intent ID from CachePaymentIntent document to update the payment intent
    const paymentIntentId = existingPaymentIntent.PaymentIntentId

    console.log(62, "paymentIntentId from existing payment intent: ", paymentIntentId)

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
}

const createLoggedInPaymentIntent = async() => {
    if(req.user.buyer) {
        console.log(89, "user is logged in, create payment intent")

        // id of logged in customer's cart will be the idempotent key in payment intent creation
        const loggedInCart = await LoggedInCart.findOne({LoggedInBuyer: req.user._id})

        // customer helper will return customer obj id
        const {newCustomer, customerId} = customer()
        
        console.log(96, "customer obj's id: ", customerId)
        console.log(97, "newCustomer: ", newCustomer)
        
        let paymentIntent

        // Create a PaymentIntent with the order amount and currency params
        // For first-time purchasing customers, include also the customer's id (Off_session for setup_future_usage params stores customer's card info so that card details are auto attached in a PaymentMethod obj to customer obj after PaymentIntent succeeds. We only need to attach the card details to the customer object for future purchases ONCE)
        if(newCustomer) {
            paymentIntent = await stripe.paymentIntents.create({
                customer: customerId,
                amount: calculateOrderAmount(),
                currency: "usd"
            }, {
                idempotencyKey: loggedInCart._id
            });
        } else {
            // Retrieve the payment method ID
            const paymentMethod = checkoutPaymentMethod()
            const paymentMethodID = paymentMethod.id
        
            // You can charge the customer immediately by confirming payment intent immediately by setting confirm: true. But we will confirm payment intent on client side, so do not set confirm: true (default is confirm: false)
            paymentIntent = await stripe.paymentIntents.create({
                amount: calculateOrderAmount(),
                currency: "usd",
                customer: customerId,
                payment_method: paymentMethodID,
                off_session: true, 
                }, {
                idempotencyKey: loggedInCart._id
            });
        }
        
        console.log("creating payment intent for logged in user ", paymentIntent)

        // store the created payment intent's id & the idempotent key in CachePaymentIntent database
        const cache = await CachePaymentIntent.create({
            Customer: customerId,
            Idempotency: req.headers['Idempotency-Key'],
            PaymentIntentId: paymentIntent.id
        })

        console.log("cache: ", cache)

        res.status(200).json({
            publicKey: process.env.STRIPE_PUBLIC,
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
            returningCustomer: newCustomer ? !newCustomer : newCustomer,
            customer: true
        });
    } 
}

const createGuestPaymentIntent = async() => {
    console.log(154, "user not logged in, create payment intent")
                
    const idempotencyKey = uuidv4() // Randomly create an idempotency key value, which is used to avoid creating a duplicate payment intent

    // if user is not logged in, do not create a payment intent with customer property
    const paymentIntent = await stripe.paymentIntents.create({
        amount: calculateOrderAmount(),
        currency: "usd"
    }, {
        idempotencyKey: idempotencyKey
    });

    console.log(166, "creating payment intent for guest user ", paymentIntent)

    // Store the idempotency key in CachePaymentIntent database. When the client sends the idempotency key back, we will check our database to see if we already made a payment intent that is associated with the idempotency key value.
    const cache = await CachePaymentIntent.create({
        Idempotency: idempotencyKey,
        PaymentIntentId: paymentIntent.id
    })

    console.log(181, "cache payment intent: ", cache)

    res.status(200).json({
        publicKey: process.env.STRIPE_PUBLIC,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        returningCustomer: false,
        customer: false,
        idempotency: idempotencyKey
    });
}
// Click Checkout leads to either a) creating only ONE payment intent for each unpaid cart (exception is guest customer clears cookies in the browser, then there will be a previous incomplete payment intent), or b) updating existing payment intent by calling updateExistingPaymentIntent() helper
const createOrUpdatePaymentIntent = async(req, res) => {
    try {
        // If payment intent has already been created, update the payment intent's amount parameter to ensure the amount is the most current.
        // If payment intent has not been created, create a new payment intent with the customer id if user is logged in
        console.log(91)
        const existingPaymentIntent = await CachePaymentIntent.findOne({Idempotency: req.headers['Idempotency-Key']})
        console.log("existingPaymentIntent: ", existingPaymentIntent)
        console.log(94)

        if (existingPaymentIntent) {
            updateExistingPaymentIntent(existingPaymentIntent)
        } else {

            if(!req.headers.authorization) {
                createLoggedInPaymentIntent()
            } else if(req.headers.authorization) {
                createGuestPaymentIntent()
            }
        }
    } catch(error) {
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

module.exports = {createOrUpdatePaymentIntent}

/* payment intent succeed webhook: 
- make an order
- delete cart
- email receipt 
- update quantity of selled items */

// payment intent process webhook (happens when payment methods have delayed notification.): pending order and then if the payment intent status turns to succeed or requires payment method (the event is payment_intent.payment_failed), then do certain actions

// add the statement_descriptor to payment intent with Date.now()


