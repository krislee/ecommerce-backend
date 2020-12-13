const router = require('express').Router();
const passport = require('passport');
const passportAuthenticate = passport.authenticate('jwt', {session: false})

const {createPaymentIntent} = require('../../controller/buyer/stripe')

router.post('/', createPaymentIntent)

module.exports = router