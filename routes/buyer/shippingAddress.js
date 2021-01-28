const express = require('express');
const passport = require('passport');
const router = express.Router();
const {addShipping, updateShipping, updateLastUsedShipping, changeDefaultShipping, showShipping, indexShipping, savedShipping, checkoutShipping, deleteShipping} = require('../../controller/buyer/shippingAddress')

passportAuthenticate = passport.authenticate('jwt', {session: false})

// Get all addresses
router.get('/address', passportAuthenticate, indexShipping)

// Get all saved addresses besides the displayed address during checkout
router.get('/saved/address/:id', passportAuthenticate, savedShipping) 

// Get one address when an address is selected from the Saved Addresses during checkout
router.get('/address/:id', showShipping)

// Show either the default or last used, saved or last created, non-default, unused address
router.get('checkout/address', passportAuthenticate, checkoutShipping)

// Create shipping address with the option of creating the address default. In the checkout page, this addShipping() will only run if Save Address is checked.
router.post('/address', passportAuthenticate, addShipping) // examples: fetch to (/address?lastUsed=true&default=true or /address?lastUsed=false&default=true)

// Update one shipping address
router.put('/address/:id', passportAuthenticate, updateShipping)

// Update last used address
router.put('/last-used/address/:id', passportAuthenticate, updateLastUsedShipping)

// Add or remove the default shipping. There will only be one default shipping for the logged in user.
router.put('/default/address/:id', passportAuthenticate, changeDefaultShipping) // example: (/default/address/:id?default=true if default button is clicked and checked, or /default/address/:id?default=false is clicked and unchecked)

// Delete shipping from Shipping Address component
router.delete('/address/:id', passportAuthenticate, deleteShipping)

module.exports = router