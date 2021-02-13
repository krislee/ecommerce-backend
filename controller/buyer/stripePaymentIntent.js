require("dotenv").config()
const { v4: uuidv4 } = require('uuid');
const stripe = require("stripe")(`${process.env.STRIPE_SECRET}`)
const LoggedInCart = require('../../model/buyer/cart')
const {BuyerUser}= require('../../model/buyer/buyerUser')
const {CachePaymentIntent} = require('../../model/buyer/cachePaymentIntent')
const {checkoutPaymentMethod} = require('./stripePaymentMethod')

// Helper function calculates cart total price
const loggedInOrderAmount = async (req, res) => {
    let totalCartPrice = 0

    if(req.headers.authorization){
        // console.log(14, req.user.buyer)
        if(req.user) {

            const loggedInCart = await LoggedInCart.findOne({LoggedInBuyer: req.user._id})
            console.log(18, loggedInCart)
            for(let i=0; i<loggedInCart.Items.length; i++) {
                totalCartPrice+= loggedInCart.Items[i].TotalPrice
            }
        }
    } 
    console.log(28, "total cart price: ", totalCartPrice)
    return totalCartPrice *=100 // total cart price in cents
}

const guestOrderAmount = (req, res) => {
    let totalCartPrice = 0
    console.log(30)
    const guestCart = req.session.cart
    console.log(32, req.sessionID, req.session)
    console.log(33, "guest cart: ", guestCart)
    if(guestCart){
        for(let i=0; i<guestCart.length; i++) {
            totalCartPrice += guestCart[i].TotalPrice
        }
    }
    console.log(38, "total cart price: ", totalCartPrice)
    return totalCartPrice*=100 // total cart price in cents
}

// Click Checkout and create customer ONCE by customer() helper if user is logged in. Only need one customer object to be made for any future payments. 
// Customer obj stores details on the customer (name, email, shipping address, etc.) and the customer's card info in the payment intent
const customer = async (req, res) => { // need to passportAuthenticate this controller
    if(req.headers.authorization) {

        console.log(48, "req.user.buyer: ", req.user.buyer)

        if (req.user.buyer) {
            const loggedInUser = await BuyerUser.findById(req.user.id)
        // Check if the logged in user already has a customer object made. 
        // If there has not been any record of a customer object, then make a customer and add it to customer field of a BuyerUser document. 
        // If customer has already been made, then retrieve the customer id from the customer field of BuyerUser document.

            console.log(56, "see if there is a customer id of logged in user: ", loggedInUser.customer)

            if(!loggedInUser.customer) {
                const customer = await stripe.customers.create({metadata: {last_used_payment: null}}); 

                const updatedUser = await BuyerUser.findOneAndUpdate({_id: req.user._id}, {customer: customer.id}, {new: true})

                console.log(65, "logged in user is updated with customer ID: ", updatedUser)

                return {newCustomer: true, customerId: customer.id}
            } else {

                console.log(70, "existing logged in customer ID: ", loggedInUser.customer)
                
                return {newCustomer: false, customerId: loggedInUser.customer}
            }
        }
    } 
}

const updateGuestPaymentIntent = async(req, res) => {
    try {
        const existingPaymentIntent = await CachePaymentIntent.findOne({Idempotency: req.headers['idempotency-key']})

        // Retrieve the payment intent ID from CachePaymentIntent document to update the payment intent
        const paymentIntentId = existingPaymentIntent.PaymentIntentId

        console.log(85, "paymentIntentId from existing payment intent: ", paymentIntentId)

        // Guest has already made a payment intent by clicking checking out but then stopped checkout to log in for the very first time. Therefore, payment intent needs to be updated to also include the customer obj.
        const address = req.body.address
        console.log(89, address)
        console.log(90, req.body.saveShipping)
        const updatedPaymentIntent = await stripe.paymentIntents.update(paymentIntentId, {
                amount: guestOrderAmount(req, res),
                shipping: {
                    address: {
                        line1: address ? address.line1: "",
                        line2: address ? address.line2: "",
                        city: address ? address.city: "",
                        state: address ? address.state: "",
                        postal_code: address ? address.postalCode: "",
                        country : 'US'
                    },
                    name: address ? address.name : ""
                },
                metadata: {saveShipping: req.body.saveShipping},
            })

        console.log(104, "updated existing payment intent: ", updatedPaymentIntent)

        res.status(200).json({
            publicKey: process.env.STRIPE_PUBLIC,
            // paymentIntentId: updatedPaymentIntent.id,
            clientSecret: updatedPaymentIntent.client_secret,
            returningCustomer: false,
            customer: false,
            idempotency: req.sessionID
        });
    } catch(error) {
        console.log(115, "error: ", error)
        if(error.raw.code === 'parameter_invalid_integer' && error.param === 'amount') {
            res.status(400).json({customer: false, loggedIn: false, message: 'Please add an item to cart to checkout.'})
        } else if(error.type === 'StripeIdempotencyError') {
            res.status(400).json({message: 'Please enter the correct idempotency-key header value.'})
        } else (res.status(400).json({message: error}))
    }
}

const updateLoggedInPaymentIntent = async(req, res) => {
    try {
        const existingPaymentIntent = await CachePaymentIntent.findOne({Idempotency: req.headers['idempotency-key']})

        // Retrieve the payment intent ID from CachePaymentIntent document to update the payment intent
        const paymentIntentId = existingPaymentIntent.PaymentIntentId

        console.log(131, "paymentIntentId from existing payment intent: ", paymentIntentId)

        // Guest has already made a payment intent by clicking checking out but then stopped checkout to log in for the very first time. Therefore, payment intent needs to be updated to also include the customer obj.
        const {newCustomer, customerId} = await customer(req, res)

        console.log(136, "customer obj's id: ", customerId)
        console.log(137, "newCustomer: ", newCustomer)

        let updatedPaymentIntent
        const address = req.body.address
        console.log(141, address)
        
        if(newCustomer) {
            updatedPaymentIntent = await stripe.paymentIntents.update(paymentIntentId, {
                amount: await loggedInOrderAmount(req, res),
                customer: customerId,
                shipping: {
                    address: {
                        line1: address ? address.line1: "",
                        line2: address ? address.line2: "",
                        city: address ? address.city: "",
                        state: address ? address.state: "",
                        postal_code: address ? address.postalCode: "",
                        country : 'US'
                    },
                    name: address ? address.name : ""
                },
                metadata: {saveShipping: req.body.saveShipping, lastUsedShipping: req.body.lastUsedShipping}
            })
        } else {
            updatedPaymentIntent = await stripe.paymentIntents.update(paymentIntentId, {
                amount: await loggedInOrderAmount(req, res),
                shipping: {
                    address: {
                        line1: address ? address.line1: "",
                        line2: address ? address.line2: "",
                        city: address ? address.city: "",
                        state: address ? address.state: "",
                        postal_code: address ? address.postalCode: "",
                        country : 'US'
                    },
                    name: address ? address.name : ""
                },
                metadata: {saveShipping: req.body.saveShipping, lastUsedShipping: req.body.lastUsedShipping}
            })
        }

        console.log(178, "updated existing payment intent: ", updatedPaymentIntent)

        res.status(200).json({
            publicKey: process.env.STRIPE_PUBLIC,
            // paymentIntentId: updatedPaymentIntent.id,
            clientSecret: updatedPaymentIntent.client_secret,
            returningCustomer: !newCustomer,
            customer: true
        });
    } catch(error) {
        console.log(188, "error: ", error)
        if(error.raw.code === 'parameter_invalid_integer' && error.param === 'amount') {
            res.status(400).json({customer: false, loggedIn: false, message: 'Please add an item to cart to checkout.'})
        } else if(error.type === 'StripeIdempotencyError') {
            res.status(400).json({message: 'Please enter the correct idempotency-key header value.'})
        }else (res.status(400).json({message: error}))
    }
}

const createLoggedInPaymentIntent = async(req, res) => {
    try {
        if(req.user.buyer) {

            console.log(201, "user is logged in, create payment intent")

            // id of logged in customer's cart will be the idempotent key in payment intent creation
            const loggedInCart = await LoggedInCart.findOne({LoggedInBuyer: req.user._id})
            console.log(205, "logged in cart: ", loggedInCart)
            // Need to run the customer helper to obtain a Stripe customer obj ID which will be included to make a payment intent for logged in users (do not need to run customer helper for guest because we do not need to make a payment intent that includes customer param). Customer param is needed to save Stripe Payment Method obj ID. 
            const {newCustomer, customerId} = await customer(req, res)

            console.log(209, "customer obj's id: ", customerId)
            console.log(210, "newCustomer: ", newCustomer)

            // Create a PaymentIntent with the order amount and currency params
            // For first-time purchasing customers, include also the customer's id 
            // (Off_session value for setup_future_usage params will automatically attach card details in a PaymentMethod obj to customer obj after PaymentIntent succeeds. But we would not include setup_future_usage param since we want to manually save the card to the Stripe customer obj when user clicks 'Save card' button. We only need to attach the card details to the customer object for future purchases ONCE)
            // (You can charge the customer immediately by confirming payment intent immediately by setting confirm: true. But we will confirm payment intent on client side when user clicks pay, so do not set confirm: true (default is confirm: false))
        
            const paymentIntent = await stripe.paymentIntents.create({
                customer: customerId,
                amount: await loggedInOrderAmount(req, res),
                currency: "usd"
            }, {
                idempotencyKey: loggedInCart._id
            });
            
            console.log(225, "creating payment intent for logged in user ", paymentIntent)

            // store the created payment intent's id & the idempotent key in CachePaymentIntent database
            const cache = await CachePaymentIntent.create({
                Customer: customerId,
                Idempotency: loggedInCart._id,
                PaymentIntentId: paymentIntent.id
            })

            console.log(234, "cache: ", cache)

            res.status(200).json({
                publicKey: process.env.STRIPE_PUBLIC,
                paymentIntentId: paymentIntent.id,
                clientSecret: paymentIntent.client_secret,
                returningCustomer: !newCustomer,
                customer: true
            });
        }
    } catch(error){
        console.log(245, "error: ", error)
        console.log(246, error.code)
        // if(error.raw.code === 'parameter_invalid_integer' && error.param === 'amount') {
        //     res.status(400).json({customer: false, loggedIn: false, message: 'Please add an item to cart to checkout.'})
        // } else if(error.type === 'StripeIdempotencyError') {
        //     res.status(400).json({message: 'Please enter the correct idempotency-key header value.'})
        // }
        if(error.raw.code === 'parameter_invalid_integer' && error.param === 'amount') {
            res.status(400).json({customer: false, loggedIn: false, message: 'Please add an item to cart to checkout.'})
        } else if(error.type === 'StripeIdempotencyError') {
            res.status(400).json({message: 'Please enter the correct idempotency-key header value.'})
        }else (res.status(400).json({message: error}))
    }
}

const createGuestPaymentIntent = async(req, res) => {
    try {
        console.log(262, "user not logged in, create payment intent")
                
        // const idempotencyKey = uuidv4() // Randomly create an idempotency key value, which is used to avoid creating a duplicate payment intent
        const idempotencyKey = req.sessionID
        console.log(266, idempotencyKey)
        // if user is not logged in, do not create a payment intent with customer property
        const paymentIntent = await stripe.paymentIntents.create({
            amount: guestOrderAmount(req, res),
            currency: "usd",
            metadata: {
                sessionID: idempotencyKey
            }
        }, {
            idempotencyKey: idempotencyKey
        });

        console.log(278, "creating payment intent for guest user ", paymentIntent)

        // Store the idempotency key in CachePaymentIntent database. When the client sends the idempotency key back, we will check our database to see if we already made a payment intent that is associated with the idempotency key value.
        const cache = await CachePaymentIntent.create({
            Idempotency: idempotencyKey,
            PaymentIntentId: paymentIntent.id
        })

         console.log(286, "cache payment intent: ", cache)

        res.status(200).json({
            publicKey: process.env.STRIPE_PUBLIC,
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
            returningCustomer: false,
            customer: false,
            idempotency: idempotencyKey
        });
    } catch(error){
        console.log(297, error)
        console.log(298, error.code)
        if(error.raw.code === 'parameter_invalid_integer' && error.param === 'amount') {
            res.status(400).json({customer: false, loggedIn: false, message: 'Please add an item to cart to checkout.'})
        } else if(error.type === 'StripeIdempotencyError') {
            res.status(400).json({message: 'Please enter the correct idempotency-key header value.'})
        } else (res.status(400).json({message: error}))
    }
}
// Click Checkout leads to either a) creating only ONE payment intent for each unpaid cart (exception is guest customer clears cookies in the browser, then there will be a previous incomplete payment intent), or b) updating existing payment intent by calling updateExistingPaymentIntent() helper
const createOrUpdatePaymentIntent = async(req, res) => {
    try {
        // If payment intent has already been created, update the payment intent's amount parameter to ensure the amount is the most current.
        // If payment intent has not been created, create a new payment intent with the customer id if user is logged in
        // console.log(req.headers['authorization'])
        console.log(312, "idempotency key header value: ", req.headers['idempotency-key'])
        const idempotency = req.headers['idempotency-key']
        const existingPaymentIntent = await CachePaymentIntent.findOne({Idempotency: idempotency})

        console.log(316, "existingPaymentIntent: ", existingPaymentIntent)

        if (existingPaymentIntent) {
            if(req.headers.authorization) {
                res.redirect(307, '/logged-in/update/payment-intent') 
            } else {
                updateGuestPaymentIntent(req, res)
            }
            
        } else { // When user does not enter idempotency, idempotency value is underfined but the database appears to still find an existing payment intent. If the user enters a wrong idempotency, then existing payment intent is null. Either scenario, we should create a new payment intent
            if(req.headers.authorization) {
                res.redirect(307, '/logged-in/create/payment-intent')
                // createLoggedInPaymentIntent(req, res)
            } else if(!req.headers.authorization) {
                createGuestPaymentIntent(req, res)
            }
        }
    } catch(error) {
        console.log(334, "error: ", error)
        res.status(400).json({error: error})
    }
}

module.exports = {createOrUpdatePaymentIntent, createLoggedInPaymentIntent, updateLoggedInPaymentIntent}


/* Idempotency:
https://medium.com/dsc-hit/creating-an-idempotent-api-using-node-js-bdfd7e52a947
https://medium.com/@saurav200892/how-to-achieve-idempotency-in-post-method-d88d7b08fcdd
https://github.com/stripe/stripe-node/issues/877
https://github.com/stripe/react-stripe-js/issues/85 */
