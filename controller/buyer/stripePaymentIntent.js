require("dotenv").config()
const { v4: uuidv4 } = require('uuid');
const stripe = require("stripe")(`${process.env.STRIPE_SECRET}`)
const LoggedInCart = require('../../model/buyer/cart')
const LoggedInUser = require('../../model/buyer/buyerUser')
const CachePaymentIntent = require('../../model/buyer/cachePaymentIntent')
const {checkoutPaymentMethod} = require('./stripePaymentMethod')

// Helper function calculates cart total price
const calculateOrderAmount = (req, res) => {
    let totalCartPrice = 0
    if(req.headers.authorization){
        if(req.user) {
            const loggedInCart = LoggedInCart.findOne({LoggedInBuyer: req.user._id})

            for(let i=0; i<loggedInCart.Items.length; i++) {
                totalCartPrice+= loggedInCart.Items.TotalPrice
            }
        }
    } else { 
        const guestCart = req.session.cart
        console.log(22, "guest cart: ", guestCart)

        for(let i=0; i<guestCart.length; i++) {
            totalCartPrice += guestCart[i].TotalPrice
        }
    }
    console.log(28, "total cart price: ", totalCartPrice)
    return totalCartPrice *=100 // total cart price in cents
}

// Click Checkout and create customer ONCE by customer() helper if user is logged in. Only need one customer object to be made for any future payments. 
// Customer obj stores details on the customer (name, email, shipping address, etc.) and the customer's card info in the payment intent
const customer = async (req, res) => { // need to passportAuthenticate this controller
    console.log(35)
    if(req.headers.authorization) {
        if (req.user.buyer) {
            const loggedInUser = await LoggedInUser.findById(req.user._id)
            console.log(39)
        // Check if the logged in user already has a customer object made. 
        // If there has not been any record of a customer object, then make a customer and add it to customer field of a BuyerUser document. 
        // If customer has already been made, then retrieve the customer id from the customer field of BuyerUser document.
            if(!loggedInUser.customer) {
                const customer = await stripe.customers.create({metadata: {last_used_payment: null}}); 
                console.log(45, "customer: ", customer)

                await LoggedInUser.findOneAndUpdate({_id: req.user._id}, {customer: customer.id}, {new: true})

                const loggedInUser = await LoggedInUser.findById(req.user._id) // delete this after it works - it is just for console logging
                console.log(50, "logged in user with customer object: ", loggedInUser)

                return {newCustomer: true, customerId: customer.id}
            } else {
                console.log(54, "guest customer: ", loggedInUser.customer)
                return {newCustomer: false, customerId: loggedInUser.customer}
            }
        }
    } //else {
        //return {newCustomer: false, customerId: null}
    //}
}

const updateExistingPaymentIntent = async(req, res) => {
    try {
        const existingPaymentIntent = await CachePaymentIntent.findOne({Idempotency: req.headers['idempotency-key']})

        // Retrieve the payment intent ID from CachePaymentIntent document to update the payment intent
        const paymentIntentId = existingPaymentIntent.PaymentIntentId

        console.log(70, "paymentIntentId from existing payment intent: ", paymentIntentId)

        // Guest has already made a payment intent by clicking checking out but then stopped checkout to log in for the very first time. Therefore, payment intent needs to be updated to also include the customer obj.
        const {newCustomer, customerId} = customer(req, res)

        let updatedPaymentIntent

        if(newCustomer) {
            updatedPaymentIntent = await stripe.paymentIntents.update(paymentIntentId, {
                amount: calculateOrderAmount(req, res),
                customer: customerId
            })
        } else {
            updatedPaymentIntent = await stripe.paymentIntents.update(paymentIntentId, {
                amount: calculateOrderAmount(req, res)
            })
        }

        console.log(88, "updated existing payment intent: ", updatedPaymentIntent)

        res.status(200).json({
            publicKey: process.env.STRIPE_PUBLIC,
            // paymentIntentId: updatedPaymentIntent.id,
            clientSecret: updatedPaymentIntent.client_secret
        });
    } catch(error) {
        console.log("error: ", error)
    }
}

const createLoggedInPaymentIntent = async(req, res) => {
    try {
        if(req.user.buyer) {
            console.log(103, "user is logged in, create payment intent")

            // id of logged in customer's cart will be the idempotent key in payment intent creation
            const loggedInCart = await LoggedInCart.findOne({LoggedInBuyer: req.user._id})

            // Need to run the customer helper to obtain a Stripe customer obj ID which will be included to make a payment intent for logged in users (do not need to run customer helper for guest because we do not need to make a payment intent that includes customer param). Customer param is needed to save Stripe Payment Method obj ID. 
            const {newCustomer, customerId} = customer(req, res)
            
            console.log(111, "customer obj's id: ", customerId)
            console.log(112, "newCustomer: ", newCustomer)

            // Create a PaymentIntent with the order amount and currency params
            // For first-time purchasing customers, include also the customer's id 
            // (Off_session value for setup_future_usage params will automatically attach card details in a PaymentMethod obj to customer obj after PaymentIntent succeeds. But we would not include setup_future_usage param since we want to manually save the card to the Stripe customer obj when user clicks 'Save card' button. We only need to attach the card details to the customer object for future purchases ONCE)
            // (You can charge the customer immediately by confirming payment intent immediately by setting confirm: true. But we will confirm payment intent on client side when user clicks pay, so do not set confirm: true (default is confirm: false))
        
            const paymentIntent = await stripe.paymentIntents.create({
                customer: customerId,
                amount: calculateOrderAmount(req, res),
                currency: "usd"
            }, {
                idempotencyKey: loggedInCart._id
            });
            
            console.log(127, "creating payment intent for logged in user ", paymentIntent)

            // store the created payment intent's id & the idempotent key in CachePaymentIntent database
            const cache = await CachePaymentIntent.create({
                Customer: customerId,
                Idempotency: req.headers['idempotency-key'],
                PaymentIntentId: paymentIntent.id
            })

            console.log(136, "cache: ", cache)

            res.status(200).json({
                publicKey: process.env.STRIPE_PUBLIC,
                paymentIntentId: paymentIntent.id,
                clientSecret: paymentIntent.client_secret,
                returningCustomer: newCustomer ? !newCustomer : newCustomer,
                customer: true
            });
        }
    } catch(error){
        console.log("error: ", error)
    }
}

const createGuestPaymentIntent = async(req, res) => {
    try {
        console.log(153, "user not logged in, create payment intent")
                
        const idempotencyKey = uuidv4() // Randomly create an idempotency key value, which is used to avoid creating a duplicate payment intent

        // if user is not logged in, do not create a payment intent with customer property
        const paymentIntent = await stripe.paymentIntents.create({
            amount: calculateOrderAmount(req, res),
            currency: "usd"
        }, {
            idempotencyKey: idempotencyKey
        });

        console.log(165, "creating payment intent for guest user ", paymentIntent)

        // Store the idempotency key in CachePaymentIntent database. When the client sends the idempotency key back, we will check our database to see if we already made a payment intent that is associated with the idempotency key value.
        const cache = await CachePaymentIntent.create({
            Idempotency: idempotencyKey,
            PaymentIntentId: paymentIntent.id
        })

        console.log(173, "cache payment intent: ", cache)

        res.status(200).json({
            publicKey: process.env.STRIPE_PUBLIC,
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
            returningCustomer: false,
            customer: false,
            idempotency: idempotencyKey
        });
    } catch(error){
        console.log(184, "error: ", error)
    }
}
// Click Checkout leads to either a) creating only ONE payment intent for each unpaid cart (exception is guest customer clears cookies in the browser, then there will be a previous incomplete payment intent), or b) updating existing payment intent by calling updateExistingPaymentIntent() helper
const createOrUpdatePaymentIntent = async(req, res) => {
    try {
        // If payment intent has already been created, update the payment intent's amount parameter to ensure the amount is the most current.
        // If payment intent has not been created, create a new payment intent with the customer id if user is logged in
        console.log(192, "idempotency key header value: ", req.headers['idempotency-key'])
        const existingPaymentIntent = await CachePaymentIntent.findOne({Idempotency: req.headers['idempotency-key']})
        console.log(194, "existingPaymentIntent: ", existingPaymentIntent)

        if (existingPaymentIntent) {
            updateExistingPaymentIntent(req, res)
        } else {

            if(req.headers.authorization) {
                res.redirect(307, '/logged-in/create-payment-intent')
                // createLoggedInPaymentIntent(req, res)
            } else if(!req.headers.authorization) {
                createGuestPaymentIntent(req, res)
            }
        }
    } catch(error) {
        console.log(207, "error: ", error)
    }
}

module.exports = {createOrUpdatePaymentIntent, createLoggedInPaymentIntent}


/* Idempotency:
https://medium.com/dsc-hit/creating-an-idempotent-api-using-node-js-bdfd7e52a947
https://medium.com/@saurav200892/how-to-achieve-idempotency-in-post-method-d88d7b08fcdd
https://github.com/stripe/stripe-node/issues/877
https://github.com/stripe/react-stripe-js/issues/85 */
