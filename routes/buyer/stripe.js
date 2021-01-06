const router = require('express').Router();
const passport = require('passport');
const passportAuthenticate = passport.authenticate('jwt', {session: false})

const {createPaymentIntent, publicKey} = require('../../controller/buyer/stripe')

router.post('/', createPaymentIntent)
router.get('/', publicKey)

module.exports = router