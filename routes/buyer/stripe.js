const router = require('express').Router();
const passport = require('passport');
const passportAuthenticate = passport.authenticate('jwt', {session: false})

const {createOrUpdatePaymentIntent, createLoggedInPaymentIntent, updateLoggedInPaymentIntent} = require('../../controller/buyer/stripePaymentIntent')

const {indexPaymentMethods, showPaymentMethod, updatePaymentMethod, deletePaymentMethod, defaultPaymentMethod, removeDefaultPaymentMethod, createPaymentMethod, sendCheckoutPaymentMethod} = require('../../controller/buyer/stripePaymentMethod')

const {webhook} = require('../../controller/buyer/stripeWebhook')

/* ------- PAYMENT INTENT ROUTER ------- */
// Create or update payment intent Router. This route will be rerouted for logged in users.
router.post('/payment-intent', createOrUpdatePaymentIntent)

// Create a new payment intent for logged in user
router.post('/create/payment-intent', passportAuthenticate, createLoggedInPaymentIntent)

// Update existing payment intent for logged in user
router.post('/update/payment-intent', passportAuthenticate, updateLoggedInPaymentIntent)


/* ------- PAYMENT METHODS ROUTER ------- */
// Show all payment methods the logged in user made
router.get('/index/payment', passportAuthenticate, indexPaymentMethods)

// Show one payment method when one of the payment method from the Saved Cards at checkout is selected
router.get('/show/payment/:id', passportAuthenticate, showPaymentMethod)

// When the checkout page is loaded, either the default, or last used, saved, or saved, non-default, unused payment method
router.get('/checkout/payment', passportAuthenticate, sendCheckoutPaymentMethod)

// Updates the already created payment method to be the default
router.get('/default/payment/:id', passportAuthenticate, defaultPaymentMethod) 

// Create a payment method with the option as default
router.post('/payment', passportAuthenticate, createPaymentMethod) //(include req.body: fingerprint and paymentMethodID)

// Update the selected payment method at Payment Method or at checkout
router.put('/payment/:id', passportAuthenticate, updatePaymentMethod) //(include in req.body: billingDetails, expMonth, expYear, name, recollectCVV)

// Delete the selected payment method
router.delete('/payment/:id', passportAuthenticate, deletePaymentMethod)


/* ------- WEBHOOK EVENTS ROUTER ------- */
router.post("/events", webhook);
  



module.exports = router