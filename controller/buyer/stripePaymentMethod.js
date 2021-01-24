require("dotenv").config()
const stripe = require("stripe")(`${process.env.STRIPE_SECRET}`)
const LoggedInUser = require('../../model/buyer/buyerUser')

// Get all payment methods attached to the Stripe customer for Payment Method component and saved cards modal during checkout
const indexPaymentMethods = async(req, res) => {
    try {
        if(req.user.buyer) {
            const loggedInUser = await LoggedInUser.findById(req.user._id)
  
            const paymentMethods = await stripe.paymentMethods.list({
                customer: loggedInUser.customer, // customer's id stored in found BuyerUser's document
                type: 'card',
            });
            
            // Get the default payment method ID to display it in Payment Method component
            const customer = await stripe.customers.retrieve(loggedInUser.customer)
            defaultPaymentMethodID = customer.invoice_settings.default_payment_method

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
                    },
                    recollectCVV: paymentMethod[metadata][recollect_cvv] ? true : false
                }
                if (paymentMethod.paymentMethodID === defaultPaymentMethodID) {
                    paymentMethod.default = true
                } else {
                    paymentMethod.default = false
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

// Show one payment method attached to the Stripe customer when Select button is clicked in saved cards modal during checkout
const showPaymentMethod = async(req, res) => {
    try {
        if(req.user.buyer) {
            const paymentMethod = await stripe.paymentMethods.retrieve(req.params.id)
            res.status(200).json({
                paymentMethodID: paymentMethod.id,
                brand: paymentMethod[card][brand],
                last4: paymentMethod[card][last4],
                expDate: `${paymentMethod[card][exp_month]}/${paymentMethod[card][exp_year]}`,
                billingDetails: {
                    address: paymentMethod[billing_details][address],
                    name: paymentMethod[billing_details][name]
                },
                recollectCVV: paymentMethod[metadata][recollect_cvv] ? true : false
            })
        }
    } catch(error) {
        console.log("error", error)
        res.status(400).json({msg: "Error"})
    }
}

// Update payment method when Save button is clicked on Payment Method component or during checkout. The Save button has the payment method ID. 
// There will be name and address input. The exp date will be retrieved from input type=month on the client side.
// When updating the payment method during checkout, there will be CVV card element, which will be used in confirmCardPayment()
// Client will also send back in fetch body whether to recollect CVV later in checkout or not. During checkout, recollectCVV will be sent back false since we will already be recollecting CVV. 
// CHECK IF UPDATING PAYMENT METHOD WILL ALTER THE LIST OF PAYMENT METHODS
const updatePaymentMethod = async(req, res) => {
    try {
        if(req.user.buyer) {
            const loggedInUser = await LoggedInUser.findById(req.user._id)

            // REMOVE THE CODE BELOW AFTER CHECKING
            const paymentMethods = await stripe.paymentMethods.list({
                customer: loggedInUser.customer, // customer's id stored in found BuyerUser's document
                type: 'card',
            });
            console.log("before updating payment method: ", paymentMethods)

            const {billingDetails, expMonth, expYear, name, recollectCVV} = req.body
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
                    cardholder_name: name,
                    recollect_cvv: recollectCVV
                },
                card: {
                    exp_month: expMonth,
                    exp_year: expYear
                }
            })

            // REMOVE THE CODE BELOW AFTER CHECKING
            const updatedPaymentMethods = await stripe.paymentMethods.list({
                customer: loggedInUser.customer, // customer's id stored in found BuyerUser's document
                type: 'card',
            });
            console.log("after updating payment method: ", updatedPaymentMethods)


            // Send back the updated payment method details
            res.status(200).json({
                paymentMethodID: updatedPaymentMethod.id,
                brand: updatedPaymentMethod[card][brand],
                last4: updatedPaymentMethod[card][last4],
                expDate: `${updatedPaymentMethod[card][exp_month]}/${updatedPaymentMethod[card][exp_year]}`,
                billingDetails: {
                    address: updatedPaymentMethod[billing_details][address],
                    name: updatedPaymentMethod[billing_details][name]
                },
                recollectCVV: updatedPaymentMethod[metadata][recollect_cvv] ? true : false
            })
        }
    } catch(error) {
        console.log("error", error)
        res.status(400).json({msg: "Error"})
    }
}

// Detach payment method from customer and send back all the other payment methods attached to the customer for Payment Methods component.
const deletePaymentMethod = async(req, res) => {
    try {
        if(req.user.buyer) {
            const paymentMethod = await stripe.paymentMethods.detach(req.params.id)
            indexPaymentMethods(req, res)
        }
    } catch(error) {
        console.log("error", error)
        res.status(400).json({msg: "Error"})
    }
}

// When client's default payment method box in the Payment Method component is clicked and checked defaultPaymentMethod() will run
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

            res.status(200).json({paymentMethodID: req.query.pm})
        }
    } catch(error){
        console.log(" default Payment method error", error)
        res.status(400).json({msg: "Error"})
    }
}

// Remove default payment method
const removeDefaultPaymentMethod = async(req, res) => {
    try {
        if(req.user.buyer) {
            // Get the user's info, which contains customer's ID
            const loggedInUser = await LoggedInUser.findById(req.user._id)
            
            // Update the Stripe customer object to remove the default payment method
            const updatedCustomer = await stripe.customers.update(loggedInUser.customer, {
                invoice_settings: {
                    default_payment_method: ""
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

// During checkout, if user adds a new card and checks off save card for future payment then: client runs stripe.createPaymentMethod() --> run server-side createPaymentMethod() listed below --> client runs stripe.confirmCardPayment with the returned payment method id from the server side
// If client only clicks on new card during checkout, then only stripe.confirmCardPayment() runs on the client side without running server-side createPaymentMethod() listed below so card details are not attached to the customer
// If user is adding a new card in Payment Method component, then: client runs stripe.createPaymentMethod() --> run server-side createPaymentMethod() listed below
// MAKE SURE TO ADD IN METADATA WITH RECOLLECT_CVV AS A PARAMETER FOR stripe.createPaymentMethod() ON CLIENT SIDE
const createPaymentMethod = async(req, res) => {
    try {
        if(req.user.buyer) {
            // Get the user's info, which contains customer's ID
            const loggedInUser = await LoggedInUser.findById(req.user._id)
            // Get Stripe customer
            const customer = await stripe.customers.retrieve(loggedInUser.customer)
            // Get all the payment methods attached to the customer
            const paymentMethods = await stripe.paymentMethods.list({
                customer: loggedInUser.customer, // customer's id stored in found BuyerUser's document
                type: 'card',
            });

            let match = false
            let oldPaymentMethodID = ""
            for(let i=0; i < paymentMethods.data.length; i++) {
                if(paymentMethods.data[i][card][fingerprint] === req.body.fingerprint) {
                    match = true
                    oldPaymentMethodID = paymentMethods.data[i][id]
                }
            }

            // If the new payment method that the user is trying to add does match to the payment method already attached to the stripe customer, first detach the older same payment method and then attach the new payment method to the Stripe customer.
            // If the new payment method that the user is trying to add does not match any payment methods already attached to the Stripe customer, then proceed to attach the new payment method to the Stripe customer
            if(match){
                const removeOldMatchedPaymentMethod = await stripe.paymentMethods.detach(oldPaymentMethodID)
            }
            const attachPaymentMethod = await stripe.paymentMethods.attach(req.body.paymentMethodID, {
                customer: loggedInUser.customer
            })

            const paymentMethod = await stripe.paymentMethods.retrieve(req.body.paymentMethodID)

            res.status(200).json({
                paymentMethodID: paymentMethod.id,
                brand: paymentMethod[card][brand],
                last4: paymentMethod[card][last4],
                expDate: `${paymentMethod[card][exp_month]}/${paymentMethod[card][exp_year]}`,
                billingDetails: {
                    address: paymentMethod[billing_details][address],
                    name: paymentMethod[billing_details][name]
                },
                recollectCVV: paymentMethod[metadata][recollect_cvv] ? true : false
            })
        }
    } catch(error) {
        console.log("error", error)
        res.status(400).json({msg: "Error"})
    }
}


// Returns the default or last used, saved payment method or the first created list of payment methods or null for logged in user
const checkoutPaymentMethod = async(req, res) => {
    try {
        if(req.user.buyer) {

            let paymentMethod

            // Get the logged in user's info, which contains customer's ID
            const loggedInUser = await LoggedInUser.findById(req.user._id)
            // Get the Stripe customer
            const customer = await stripe.customers.retrieve(loggedInUser.customer)

            if(customer) {
                // Get the default payment method stored in Stripe customer. The value is null if no default is stored.
                const defaultPaymentMethod = await customer.invoice_settings.default_payment_method

                console.log("default payment method ID: ", defaultPaymentMethod)

                if(defaultPaymentMethod) {
                    paymentMethod = await stripe.paymentMethods.retrieve(defaultPaymentMethod)

                    console.log("default payment method obj: ", paymentMethod)

                } 

                // If there is no default payment method, get the last used, saved payment method that is also stored in Stripe customer object
                
                if (!defaultPaymentMethod) {
                    const lastUsedPaymentMethodID = await customer.metadata.last_used_payment // metadata.last_used_payment's default value is null, or is updated with the used payment method ID in the payment_intent.succeed event webhook

                    // Check if the last used payment method is saved to the customer because if the last used payment method was not saved to the customer, then we cannot display it to the customer:
                    const allPaymentMethods = await stripe.paymentMethods.list({
                        customer: loggedInUser.customer, // customer's id stored in found BuyerUser's document
                        type: 'card',
                    });
                    
                    let lastUsedSavedPaymentMethodID = ""
                    if(allPaymentMethods.data !== []) {
                        for(let i=0; i<allPaymentMethods.data.length; i++) {
                            if (allPaymentMethods.data[i].id === lastUsedPaymentMethodID) {
                                lastUsedSavedPaymentMethodID = lastUsedPaymentMethodID
                            }
                        }
                    }

                    console.log(304, "lastUsedSavedPaymentMethodID: ", lastUsedSavedPaymentMethodID)

                    if(lastUsedSavedPaymentMethodID) {
                        paymentMethod = await stripe.paymentMethods.retrieve(lastUsedSavedPaymentMethodID)
    
                        console.log("last used payment method obj: ", paymentMethod)
                    }
                }

            } else {
                // If there is no default or last used, saved payment method, then check if there are any saved payment methods user created but have not made any purchases yet. If there are no saved payment methods, then send back null for no any record of payment methods for the Stripe customer object.
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

// Send to client the default or last used payment method or the first created list of payment methods or null for logged in user (basically the same function as checkoutPaymentMethod function)
const sendCheckoutPaymentMethod = async(req, res) => {
    try {
        if(req.user.buyer) {
            // Get the logged in user's info, which contains customer's ID
            const loggedInUser = await LoggedInUser.findById(req.user._id)
            // Get the Stripe customer
            const customer = await stripe.customers.retrieve(loggedInUser.customer)

            // Get the default payment method stored in Stripe customer. The value is null if no default is stored.
            const defaultPaymentMethod = await customer.invoice_settings.default_payment_method

            console.log("default payment method ID: ", defaultPaymentMethod)

            // If there is no default payment method, get the last used, saved payment method that is also stored in Stripe customer object
            
            if (!defaultPaymentMethod) {
                const lastUsedPaymentMethodID = await customer.metadata.last_used_payment // metadata.last_used_payment's default value is null, or is updated with the used payment method ID in the payment_intent.succeed event webhook

                // Check if the last used payment method is saved to the customer because if the last used payment method was not saved to the customer, then we cannot display it to the customer:
                const allPaymentMethods = await stripe.paymentMethods.list({
                    customer: loggedInUser.customer, // customer's id stored in found BuyerUser's document
                    type: 'card',
                });
                
                let lastUsedSavedPaymentMethodID = ""
                if(allPaymentMethods.data !== []) {
                    for(let i=0; i<allPaymentMethods.data.length; i++) {
                        if (allPaymentMethods.data[i].id === lastUsedPaymentMethodID) {
                            lastUsedSavedPaymentMethodID = lastUsedPaymentMethodID
                        }
                    }
                }
                    
            }

            console.log(275, "lastUsedSavedPaymentMethodID: ", lastUsedSavedPaymentMethodID)

            // Get the Stripe payment method object if there is a default or last used payment method ID. If there is no default or last used payment method, then check if there are any saved payment methods user created but have not made any purchases yet. If there are no saved payment methods, then send back null for no any record of payment methods for the Stripe customer object.
            let paymentMethod
            if(defaultPaymentMethod) {
                paymentMethod = await stripe.paymentMethods.retrieve(defaultPaymentMethod)

                console.log("default payment method obj: ", paymentMethod)

            } else if(lastUsedSavedPaymentMethodID) {
                paymentMethod = await stripe.paymentMethods.retrieve(lastUsedSavedPaymentMethodID)

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

            // If there are no default payment method, last used, saved payment method, or saved payment methods, send back null
            if(!req.paymentMethod) {
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
                },
                recollectCVV: paymentMethod[metadata][recollect_cvv] ? true : false
            })
            
        }
    } catch(error){
        console.log("error", error)
        res.status(400).json({msg: "Error"})
    }
}


// https://github.com/stripe/stripe-payments-demo/issues/45


module.exports = {indexPaymentMethods, showPaymentMethod, updatePaymentMethod, deletePaymentMethod, defaultPaymentMethod, removeDefaultPaymentMethod, createPaymentMethod, checkoutPaymentMethod, sendCheckoutPaymentMethod}