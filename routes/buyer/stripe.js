const router = require('express').Router();
const passport = require('passport');
const passportAuthenticate = passport.authenticate('jwt', {session: false})

const {createOrUpdatePaymentIntent} = require('../../controller/buyer/stripePaymentIntent')

const {indexPaymentMethods, showPaymentMethod, updatePaymentMethod, deletePaymentMethod, defaultPaymentMethod, removeDefaultPaymentMethod, createPaymentMethod, sendCheckoutPaymentMethod} = require('../../controller/buyer/stripePaymentMethod')

const {webhook} = require('../../controller/buyer/stripeWebhook')


// Create or update payment intent Router
router.post('/', createOrUpdatePaymentIntent)


// Payment Methods Router
router.get('/index/payment', passportAuthenticate, indexPaymentMethods)
router.get('/show/payment/:id', passportAuthenticate, showPaymentMethod)
router.get('/checkout/payment', passportAuthenticate, sendCheckoutPaymentMethod)

router.get('/default/payment', passportAuthenticate, defaultPaymentMethod) // fetch(/default/payment?pm=pm_id)
router.delete('/default/payment', passportAuthenticate, removeDefaultPaymentMethod)

router.post('/payment', passportAuthenticate, createPaymentMethod) //(include req.body: fingerprint and paymentMethodID)

router.put('/payment/:id', passportAuthenticate, updatePaymentMethod) //(include in req.body: billingDetails, expMonth, expYear, name, recollectCVV)

router.delete('/payment/:id', passportAuthenticate, deletePaymentMethod)

// Webhook Event Router
router.post("/events", webhook);
  



module.exports = router