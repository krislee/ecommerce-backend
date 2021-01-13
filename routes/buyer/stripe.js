const router = require('express').Router();
const passport = require('passport');
const passportAuthenticate = passport.authenticate('jwt', {session: false})

const {createPaymentIntent, getCustomerDetails} = require('../../controller/buyer/stripe')

router.post('/', createPaymentIntent)
router.get('/', getCustomerDetails)

module.exports = router