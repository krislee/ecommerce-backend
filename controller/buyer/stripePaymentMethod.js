require("dotenv").config()
const stripe = require("stripe")(`${process.env.STRIPE_SECRET}`)
const LoggedInCart = require('../../model/buyer/cart')
const LoggedInUser = require('../../model/buyer/buyerUser')
const CachePaymentIntent = require('../../model/buyer/cachePaymentIntent')

const indexPaymentMethods = async(req, res) => {
    try {
        if(req.user.buyer) {
            const loggedInUser = await LoggedInUser.findById(req.user._id)
  
            const paymentMethods = await stripe.paymentMethods.list({
                customer: loggedInUser.customer, // customer's id stored in found BuyerUser's document
                type: 'card',
            });
            
            const allPaymentMethods = []

            // Loop through all the payment method objects and send back only the id, brand, last4 digits, exp. date, and billing details for each payment method obj instead of just sending paymentMethods.data
            for(let i=0; i < paymentMethods.data.length; i++) {
                const paymentMethod = {
                    paymentMethodID: paymentMethods[data][i][id],
                    brand: paymentMethods[data][i][card][brand],
                    last4: paymentMethods[data][i][card][last4],
                    expDate: `${paymentMethods[data][i][card][exp_month]}/${paymentMethods[data][i][card][exp_year]}`,
                    billingDetails: {
                        address: paymentMethods[data][i][billing_details][address],
                        name: paymentMethods[data][i][billing_details][name]
                    }
                }
                allPaymentMethods.push(paymentMethod)

            }
    
            res.status(200).json({paymentMethods: allPaymentMethods})
        }
    } catch(error) {
        console.log("error", error)
        res.status(400).json({msg: "Error"})
    }
}

// Update payment method when Save button is clicked on Payment Method component. The Save button has the payment method ID
const updatePaymentMethod = async() => {
    try {
        const {billingDetails, expMonth, expYear, name} = req.body
        const updatedPaymentMethod = await stripe.paymentMethods.update(req.params.id, {
            billing_details: {
                address: {
                    line1: billingDetails.line1,
                    line2: billingDetails.line2,
                    city: billingDetails.city,
                    state: billingDetails.state,
                    postal_code: billingDetails.postal_code,
                    country: billingDetails.country
                },
                name: billingDetails.name
            }, 
            metadata: {
                cardholder_name: name
            },
            card: {
                exp_month: expMonth,
                exp_year: expYear
            }
        })
    } catch(error) {
        console.log("error", error)
        res.status(400).json({msg: "Error"})
    }
}

// Create a setup intent 
const createPaymentMethod = async() => {
    try {
        // Get the user's info, which contains customer's ID
        const loggedInUser = await LoggedInUser.findById(req.user._id)
        // Get Stripe customer
        const customer = await stripe.customers.retrieve(loggedInUser.customer)


    } catch(error) {
        console.log("error", error)
        res.status(400).json({msg: "Error"})
    }
}

// Delete setup intent
const deletePaymentMethod = async() => {
    try {

    } catch(error) {
        console.log("error", error)
        res.status(400).json({msg: "Error"})
    }
}

// Client's default payment method box clicked and checked will run defaultPaymentMethod() in the payment method component 
const defaultPaymentMethod = async(req, res) => {
    try {
        if(req.user.buyer) {
            // Get the user's info, which contains customer's ID
            const loggedInUser = await LoggedInUser.findById(req.user._id)
            
            // Update the Stripe customer object to include the default payment method
            const updatedCustomer = await stripe.customers.update(loggedInUser.customer, {
                invoice_settings: {
                    default_payment_method: req.query.pm
                }
            });

            console.log("updated customer: ", updatedCustomer)

            res.status(200).json({success: true})
        }
    } catch(error){
        console.log(" default Payment method error", error)
        res.status(400).json({msg: "Error"})
    }
}

// Return the default or last used payment method or the first created list of payment methods or null for logged in user
const checkoutPaymentMethod = async(req, res) => {
    try {
        if(req.user.buyer) {
            // Get the logged in user's info, which contains customer's ID
            const loggedInUser = await LoggedInUser.findById(req.user._id)
            // Get the Stripe customer
            const customer = await stripe.customers.retrieve(loggedInUser.customer)

            // Get the default payment method stored in Stripe customer. The value is null if no default is stored.
            const defaultPaymentMethod = await customer.invoice_settings.default_payment_method

            console.log("default payment method ID: ", defaultPaymentMethod)

            // If there is no default payment method, get the last used payment method that is also stored in Stripe customer object
            let lastUsedPaymentMethod
            if (!defaultPaymentMethod) {
                lastUsedPaymentMethod = await customer.metadata.last_used_payment // metadata.last_used_payment's default value is null, or is updated with the used payment method ID in the payment_intent.succeed event
            }

            console.log("last used payment method ID: ", lastUsedPaymentMethod)

            // Get the Stripe payment method object if there is a default or last used payment method ID. If there is no default or last used payment method, then check if there are any saved payment methods user created but have not made any purchases yet. If there are no saved payment methods, then send back null for no any record of payment methods for the Stripe customer object.
            let paymentMethod
            if(defaultPaymentMethod) {
                paymentMethod = await stripe.paymentMethods.retrieve(defaultPaymentMethod)

                console.log("default payment method obj: ", paymentMethod)

            } else if(lastUsedPaymentMethod) {
                paymentMethod = await stripe.paymentMethods.retrieve(lastUsedPaymentMethod)

                console.log("last used payment method obj: ", paymentMethod)

            } else {
                const allPaymentMethods = await stripe.paymentMethods.list({
                    customer: loggedInUser.customer, // customer's id stored in found BuyerUser's document
                    type: 'card',
                });

                console.log("list of customer's payment methods: ", allPaymentMethods)

                // If there are payment methods saved under the customer, then load in the first created payment method on the client side.
                if(allPaymentMethods.data !== []) {
                    //  Get the first saved payment method
                    paymentMethod = allPaymentMethods.data[allPaymentMethods.data.length - 1]

                    console.log("first saved payment method obj: ", paymentMethod)

                } else {
                    paymentMethod = null
                }
            }

            return paymentMethod

        }
    } catch(error){
        console.log("error", error)
        res.status(400).json({msg: "Error"})
    }
}

// Send to client the default or last used payment method or the first created list of payment methods or null for logged in user by calling the checkoutPaymentMethod helper with its return value as sendCheckoutPaymentMethod argument
const sendCheckoutPaymentMethod = (paymentMethod) => {
    if(!paymentMethod) {
        // If there are no default payment method, last used payment method, or saved payment methods, send back null
        res.status(200).json({
            paymentMethodID: null
        })
    }
    // Send the payment method's ID, brand, last 4, expiration date, and billing details
    res.status(200).json({
        paymentMethodID: paymentMethod.id,
        brand: paymentMethod[card][brand],
        last4: paymentMethod[card][last4],
        expDate: `${paymentMethod[card][exp_month]}/${paymentMethod[card][exp_year]}`,
        billingDetails: {
            address: paymentMethod[billing_details][address],
            name: paymentMethod[billing_details][name]
        }

    })
}





module.exports = {indexPaymentMethods, defaultPaymentMethod, checkoutPaymentMethod, sendCheckoutPaymentMethod}