require("dotenv").config()
const stripe = require("stripe")(`${process.env.STRIPE_SECRET}`)
const {BuyerUser} = require('../../model/buyer/buyerUser')

// Get all payment methods attached to the Stripe customer for Payment Method component and saved cards modal during checkout
const indexPaymentMethods = async(req, res) => {
    try {
        if(req.user.buyer) {
            const loggedInUser = await BuyerUser.findById(req.user._id)
            
            const paymentMethods = await stripe.paymentMethods.list({
                customer: loggedInUser.customer, // customer's id stored in found BuyerUser's document
                type: 'card',
            });

            console.log(16, "all payment methods attached to customer: ", paymentMethods)
            
            // Get the default payment method ID to display it in Payment Method component
            const customer = await stripe.customers.retrieve(loggedInUser.customer)
            defaultPaymentMethodID = customer.invoice_settings.default_payment_method

            console.log(22, "default payment method: ", defaultPaymentMethodID)

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
                    cardholderName: paymentMethods[data][i][metadata][cardholder_name],
                    recollectCVV: paymentMethod[metadata][recollect_cvv] // Add the recollect_cvv property to metadata. If the payment method displayed later in checkout has a recollect_cvv: true, then the user has to enter CVV again. The CVV will be added to the stripe.confirmCardPayment() parameter on the client side. recollect_cvv in metadata will only be true if payment method was updated in Payment Method component
                }
                
              
                // Add the default property to the paymentMethod obj above
                if (paymentMethod.paymentMethodID === defaultPaymentMethodID) {
                    paymentMethod.default = true 
                } else {
                    paymentMethod.default = false
                }

                // Check if this function is being called through clicking saved cards. If it is, then do not send back the already displayed payment method, so do not push into allPaymentMethods
                if(req.query.save) {
                    if(req.params.id === paymentMethod.paymentMethodID) continue
                }

                allPaymentMethods.push(paymentMethod)

                console.log(56, "a list of payment methods to send back: ", allPaymentMethods)
            }

            res.status(200).json({paymentMethods: allPaymentMethods})
        }
    } catch(error) {
        console.log(62, "error", error)
        res.status(400).json({msg: "Error"})
    }
}

// Show one payment method attached to the Stripe customer when Select button is clicked in saved cards modal during checkout
const showPaymentMethod = async(req, res) => {
    try {
        if(req.user.buyer) {
            const paymentMethod = await stripe.paymentMethods.retrieve(req.params.id)

            console.log(73, "get one payment method: ", paymentMethod)

            res.status(200).json({
                paymentMethodID: paymentMethod.id,
                brand: paymentMethod[card][brand],
                last4: paymentMethod[card][last4],
                expDate: `${paymentMethod[card][exp_month]}/${paymentMethod[card][exp_year]}`,
                billingDetails: {
                    address: paymentMethod[billing_details][address],
                    name: paymentMethod[billing_details][name]
                },
                cardholderName: paymentMethods[data][i][metadata][cardholder_name],
                recollectCVV: paymentMethod[metadata][recollect_cvv] 
            })
        }
    } catch(error) {
        console.log(89, "error", error)
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
            const loggedInUser = await BuyerUser.findById(req.user._id)

            // REMOVE THE CODE BELOW AFTER CHECKING
            const paymentMethods = await stripe.paymentMethods.list({
                customer: loggedInUser.customer, // customer's id stored in found BuyerUser's document
                type: 'card',
            });
            console.log(109, "before updating, a list of payment method: ", paymentMethods)

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

            console.log(134, "after updating payment method: ", updatedPaymentMethod)

            // REMOVE THE CODE BELOW AFTER CHECKING
            const updatedPaymentMethods = await stripe.paymentMethods.list({
                customer: loggedInUser.customer, // customer's id stored in found BuyerUser's document
                type: 'card',
            });
            console.log(141, "after updating, a list of payment methods: ", updatedPaymentMethods)


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
        console.log(158, "error", error)
        res.status(400).json({msg: "Error"})
    }
}

// Detach payment method from customer and send back all the other payment methods attached to the customer for Payment Methods component.
const deletePaymentMethod = async(req, res) => {
    try {
        if(req.user.buyer) {
            const detachedPaymentMethod = await stripe.paymentMethods.detach(req.params.id)

            console.log(165, "the detached payment method: ", detachedPaymentMethod)

            indexPaymentMethods(req, res)
        }
    } catch(error) {
        console.log("error", error)
        res.status(400).json({msg: "Error"})
    }
}

// When client's default payment method box in the Payment Method component is clicked and checked OR clicked and unchecked, defaultPaymentMethod() will run
const defaultPaymentMethod = async(req, res) => {
    try {
        if(req.user.buyer) {
            // If default button is clicked and checked
            if(req.query.default === 'true') {
                // Get the user's info, which contains customer's ID
                const loggedInUser = await BuyerUser.findById(req.user._id)
                
                // Update the Stripe customer object to include the default payment method
                const updatedCustomer = await stripe.customers.update(loggedInUser.customer, {
                    invoice_settings: {
                        default_payment_method: req.params.id
                    }
                });

                console.log(189, "updated customer: ", updatedCustomer)

                // Return all payment methods back
                indexPaymentMethods(req, res)
            } else { // If default button is clicked and unchecked
               
                // Get the user's info, which contains customer's ID		
                const loggedInUser = await LoggedInUser.findById(req.user._id)		
    
                // Update the Stripe customer object to remove the default payment method		
                const updatedCustomer = await stripe.customers.update(loggedInUser.customer, {	
                    invoice_settings: {		
                        default_payment_method: ""		
                    }		
                });		
    
                console.log("updated customer: ", updatedCustomer)		
    
                // Return all payment methods back
                indexPaymentMethods(req, res)	
            }
        }
    } catch(error){
        console.log(195, " default Payment method error", error)
        res.status(400).json({msg: "Error"})
    }
}

// During checkout, if user adds a new card AND checks off save card for future payment then: client runs stripe.createPaymentMethod() --> run server-side createPaymentMethod() listed below --> client runs stripe.confirmCardPayment with the returned payment method id from the server side
// If client only clicks on new card during checkout, then only stripe.confirmCardPayment() runs on the client side without running server-side createPaymentMethod() listed below so card details are not attached to the customer
// If user is adding a new card in Payment Method component, then: client runs stripe.createPaymentMethod() --> run server-side createPaymentMethod() listed below
// MAKE SURE TO ADD IN METADATA WITH RECOLLECT_CVV AS A PARAMETER FOR stripe.createPaymentMethod() ON CLIENT SIDE
const createPaymentMethod = async(req, res) => {
    try {
        if(req.user.buyer) {
            // Get the user's info, which contains customer's ID
            const loggedInUser = await BuyerUser.findById(req.user._id)
            // Get Stripe customer
            const customer = await stripe.customers.retrieve(loggedInUser.customer)

            console.log(235, "customer: ", customer)

            // Get all the payment methods attached to the customer
            const paymentMethods = await stripe.paymentMethods.list({
                customer: loggedInUser.customer, // customer's id stored in found BuyerUser's document
                type: 'card',
            });

            console.log(243, "a list of payment attached attached to customer: ", paymentMethods)

            let match = false
            let oldPaymentMethodID = ""
            for(let i=0; i < paymentMethods.data.length; i++) {
                if(paymentMethods.data[i][card][fingerprint] === req.body.fingerprint) {
                    match = true
                    oldPaymentMethodID = paymentMethods.data[i][id]
                }
            }
            console.log(253, "match and old payment method id", match, oldPaymentMethodID)

            // If the new payment method that the user is trying to add does match to the payment method already attached to the stripe customer, first detach the older same payment method and then attach the new payment method to the Stripe customer.
            // If the new payment method that the user is trying to add does not match any payment methods already attached to the Stripe customer, then proceed to attach the new payment method to the Stripe customer
            if(match){
                const removeOldMatchedPaymentMethod = await stripe.paymentMethods.detach(oldPaymentMethodID)

                console.log(260, "remove old matched payment method: ", removeOldMatchedPaymentMethod)
            }
            const attachPaymentMethod = await stripe.paymentMethods.attach(req.body.paymentMethodID, {
                customer: loggedInUser.customer
            })

            // Aside from logged in user checking 'Save card for future purchases' at checkout or 'Add new card' at Payment Method component, which prompts to run this function, if user also checks Save as default at checkout or Payment Method component, add it as default.
            if(req.body.default) {
                const updatedCustomer = await stripe.customers.update(loggedInUser.customer, {
                    invoice_settings: {
                        default_payment_method: req.body.paymentMethodID
                    }
                })
            }
            console.log(274, "newly attached payment method: ", attachPaymentMethod)

            // Return all payment methods back
            indexPaymentMethods(req, res)
        }
    } catch(error) {
        console.log(280, "error", error)
        res.status(400).json({msg: "Error"})
    }
}

// Send to client the default or last used payment method or the first created list of payment methods or null for logged in user (basically the same function as checkoutPaymentMethod function)
const sendCheckoutPaymentMethod = async(req, res) => {
    try {
        if(req.user.buyer) {
            // Get the logged in user's info, which contains customer's ID
            const loggedInUser = await BuyerUser.findById(req.user._id)
            // Get the Stripe customer
            const customer = await stripe.customers.retrieve(loggedInUser.customer)

            console.log(294, "customer: ", customer)

            // 1) Get the default payment method stored in Stripe customer. The value is null if no default is stored.
            const defaultPaymentMethod = await customer.invoice_settings.default_payment_method

            console.log(299, "default payment method ID: ", defaultPaymentMethod)

            // 2) If there is no default payment method, get the last used, saved payment method that is also stored in Stripe customer object
            let lastUsedSavedPaymentMethodID = ""
            if (!defaultPaymentMethod) {
                const lastUsedPaymentMethodID = await customer.metadata.last_used_payment // metadata.last_used_payment's default value is null, or is updated with the used payment method ID in the payment_intent.succeed event webhook

                console.log(306, "last used payment method id: ", lastUsedPaymentMethodID)

                // Check if the last used payment method is saved to the customer because if the last used payment method was not saved to the customer, then we cannot display it to the customer:
                const allPaymentMethods = await stripe.paymentMethods.list({
                    customer: loggedInUser.customer, // customer's id stored in found BuyerUser's document
                    type: 'card',
                });
                
                console.log(314, "all customer's payment methods: ", allPaymentMethods)

                if(allPaymentMethods.data !== []) {
                    for(let i=0; i<allPaymentMethods.data.length; i++) {
                        if (allPaymentMethods.data[i].id === lastUsedPaymentMethodID) {
                            lastUsedSavedPaymentMethodID = lastUsedPaymentMethodID
                        }
                    }
                }
                    
            }

            console.log(326, "lastUsedSavedPaymentMethodID: ", lastUsedSavedPaymentMethodID)

            // 3) Check if there are payment methods user has created in Payment Method component but has not used nor checked for default
            const allPaymentMethods = await stripe.paymentMethods.list({
                customer: loggedInUser.customer, // customer's id stored in found BuyerUser's document
                type: 'card',
            });

            // Get the Stripe payment method object if there is a default or last used, saved payment method ID. If there is no default or last used payment method, then get the payment method the user last created in the Payment Method component but has not used or check default yet. If this doesn't apply, send back null for no record of payment methods for the Stripe customer object.
            let paymentMethod
            if(defaultPaymentMethod) {
                paymentMethod = await stripe.paymentMethods.retrieve(defaultPaymentMethod)

                console.log(339, "default payment method obj: ", paymentMethod)

            } else if(lastUsedSavedPaymentMethodID) {
                paymentMethod = await stripe.paymentMethods.retrieve(lastUsedSavedPaymentMethodID)

                console.log(344, "last used payment method obj: ", paymentMethod)

            } else if(allPaymentMethods.data !== []){
                paymentMethod = null
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
                recollectCVV: paymentMethod[metadata][recollect_cvv]
            })
            
        }
    } catch(error){
        console.log(372, "error", error)
        res.status(400).json({msg: "Error"})
    }
}


// https://github.com/stripe/stripe-payments-demo/issues/45


module.exports = {indexPaymentMethods, showPaymentMethod, updatePaymentMethod, deletePaymentMethod, defaultPaymentMethod, createPaymentMethod, sendCheckoutPaymentMethod}