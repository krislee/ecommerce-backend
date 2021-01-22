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

// Load the default or last used payment method for logged in user
const checkoutPaymentMethod = async(req, res) => {
    try {
        if(req.user.buyer) {
            // Get the logged in user's info, which contains customer's ID
            const loggedInUser = await LoggedInUser.findById(req.user._id)
            // Get the Stripe customer
            const customer = await stripe.customers.retrieve(loggedInUser.customer)

            // Get the default payment method stored in Stripe customer. The value is null if no default is stored.
            const defaultPaymentMethod = await customer.invoice_settings.default_payment_method

            console.log("default payment method: ", defaultPaymentMethod)

            // If there is no default payment method, get the last used payment method that is also stored in Stripe customer object
            let lastUsedPaymentMethod
            if (!defaultPaymentMethod) {
                lastUsedPaymentMethod = await customer.metadata.last_used_payment
            }

            // Get the Stripe payment method object if there is a default or last used payment method ID. If there is no default or last used payment method, then check if there are any saved payment methods user created but have not made any purchases yet. If there are no saved payment methods, then send back null for no any record of payment methods for the Stripe customer object.
            let paymentMethod
            if(defaultPaymentMethod) {
                paymentMethod = await stripe.paymentMethods.retrieve(defaultPaymentMethod)
            } else if(lastUsedPaymentMethod) {
                paymentMethod = await stripe.paymentMethods.retrieve(lastUsedPaymentMethod)
            } else {
                const allPaymentMethods = await stripe.paymentMethods.list({
                    customer: loggedInUser.customer, // customer's id stored in found BuyerUser's document
                    type: 'card',
                });

                

                // If there are payment methods saved under the customer, then load in the first created payment method on the client side.
                if(allPaymentMethods.data !== []) {
                    allPaymentMethods.data[allPaymentMethods.data.length - 1]
                }
            }

            // Send the payment method's ID, brand, last 4, and expiration date
            res.status(200).json({
                paymentMethodID: paymentMethod.id,

            })
        }
    } catch(error){
        console.log("error", error)
        res.status(400).json({msg: "Error"})
    }
}

// Client's default payment method box clicked and checked will run defaultPaymentMethod()
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



