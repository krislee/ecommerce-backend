const express = require('express');
const passport = require('passport');
const router = express.Router();
const {addShipping, updateShipping, updateDefaultShipping, updateLastUsedShipping, indexShipping, savedShipping, checkoutShipping, deleteShipping} = require('../../controller/buyer/shippingAddress')

passportAuthenticate = passport.authenticate('jwt', {session: false})

router.get('/address', passportAuthenticate, indexShipping)

router.get('/saved/address/:id', passportAuthenticate, savedShipping)

router.get('checkout/address', passportAuthenticate, checkoutShipping)


router.post('/address', passportAuthenticate, addShipping)


router.put('/address/:id', passportAuthenticate, updateShipping)

router.put('default/address/:id', passportAuthenticate, updateDefaultShipping)

router.put('lastUsed/address/:id', passportAuthenticate, updateLastUsedShipping)


router.delete('/address/:id', passportAuthenticate, deleteShipping)

module.exports = router