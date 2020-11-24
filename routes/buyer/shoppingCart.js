const express = require('express');
const passport = require('passport');
const router = express.Router();
const {loggedInIndexCart, guestIndexCart, loggedInAddItem, guestAddItem, loggedInUpdateItemQuantity, guestUpdateItemQuantity, loggedInDeleteItem, guestDeleteItem} = require('../../controller/buyer/shoppingCart');
const passportAuthenticate = passport.authenticate('jwt', {session: false})

router.get('/electronic/cart', passportAuthenticate, loggedInIndexCart, guestIndexCart)

router.post('/electronic/cart/:id', passportAuthenticate, loggedInAddItem, guestAddItem)

router.put('/electronic/cart/:id', guestUpdateItemQuantity, passportAuthenticate, loggedInUpdateItemQuantity)

router.delete('/electronic/cart/:id', guestDeleteItem, passportAuthenticate, loggedInDeleteItem)



module.exports = router