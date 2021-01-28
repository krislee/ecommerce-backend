const express = require('express');
const passport = require('passport');
const router = express.Router();
const {addShipping, updateShipping, updateDefaultShipping, updateLastUsedShipping, indexShipping, savedShipping, checkoutShipping, deleteShipping} = require('../../controller/buyer/shippingAddress')

passportAuthenticate = passport.authenticate('jwt', {session: false})

// Get all addresses
router.get('/address', passportAuthenticate, indexShipping)

// Get all saved addresses besides the displayed address during checkout
router.get('/saved/address/:id', passportAuthenticate, savedShipping) 

// Show either the default or last used, saved address
router.get('checkout/address', passportAuthenticate, checkoutShipping)

// Create shipping address with the option of creating the address default. In the checkout page, this addShipping() will only run if default is checked. 
router.post('/address', passportAuthenticate, addShipping) // fetch to (/address?lastUsed=true or /address?lastUsed=false)

// Update one shipping address
router.put('/address/:id', passportAuthenticate, updateShipping)

router.put('default/address/:id', passportAuthenticate, updateDefaultShipping)

// router.put('lastUsed/address/:id', passportAuthenticate, updateLastUsedShipping)


router.delete('/address/:id', passportAuthenticate, deleteShipping)

module.exports = router