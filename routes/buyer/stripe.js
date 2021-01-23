const router = require('express').Router();
const passport = require('passport');
const passportAuthenticate = passport.authenticate('jwt', {session: false})

const {createOrUpdatePaymentIntent} = require('../../controller/buyer/stripePaymentIntent')

const {indexPaymentMethods, defaultPaymentMethod, checkoutPaymentMethod, sendCheckoutPaymentMethod} = require('../../controller/buyer/stripePaymentMethod')

const {webhook} = require('../../controller/buyer/stripeWebhook')


// Create or update payment intent Router
router.post('/', createOrUpdatePaymentIntent)


// Payment Methods Router
router.get('/index/payment', passportAuthenticate, indexPaymentMethods)
router.get('/default/payment', passportAuthenticate, defaultPaymentMethod)
router.get('/checkout/payment', passportAuthenticate, sendCheckoutPaymentMethod(checkoutPaymentMethod()))


// Webhook Event Router
router.post("/events", webhook);
  



module.exports = router