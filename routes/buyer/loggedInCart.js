const router = require('express').Router();
const passport = require('passport');
const passportAuthenticate = passport.authenticate('jwt', {session: false})

const {loggedInAddItem, loggedInUpdateItemQuantity, loggedInDeleteItem, loggedInIndexCart, guestCartItemQuantity} = require('../../controller/buyer/loggedInCart')

router.post('/:id', passportAuthenticate, loggedInAddItem)

router.put('/update/:id', passportAuthenticate, loggedInUpdateItemQuantity)

router.delete('/delete/:id', passportAuthenticate, loggedInDeleteItem)

router.get('/cart', passportAuthenticate, loggedInIndexCart)

router.get('/quantity/:id', passportAuthenticate, guestCartItemQuantity)

module.exports = router
