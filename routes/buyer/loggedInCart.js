const router = require('express').Router();
const passport = require('passport');
const passportAuthenticate = passport.authenticate('jwt', {session: false})

const {loggedInAddItem, loggedInUpdateItemQuantity, loggedInDeleteItem, loggedInIndexCart} = require('../../controller/buyer/loggedInCart')

router.post('/:id', passportAuthenticate, loggedInAddItem)

router.put('/update/:id', passportAuthenticate, loggedInUpdateItemQuantity)

router.delete('/delete/:id', passportAuthenticate, loggedInDeleteItem)

router.get('/cart/:id', passportAuthenticate, loggedInIndexCart)

module.exports = router
