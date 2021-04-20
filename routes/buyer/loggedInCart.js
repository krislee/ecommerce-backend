const router = require('express').Router();
const passport = require('passport');
const passportAuthenticate = passport.authenticate('jwt', {session: false}, async(error, token) => {
    if (error) console.log("ERROR in passport authenticate", error)
    console.log(5, "TOKEN in passport authenticate", token)
})

const {loggedInAddItem, loggedInUpdateItemQuantity, loggedInDeleteItem, loggedInIndexCart, loggedInCartItemQuantity} = require('../../controller/buyer/loggedInCart')

router.post('/:id', passportAuthenticate, loggedInAddItem)

router.put('/update/:id', passportAuthenticate, loggedInUpdateItemQuantity)

router.delete('/delete/:id', passportAuthenticate, loggedInDeleteItem)

router.get('/cart', passportAuthenticate, loggedInIndexCart)

router.get('/quantity/:id', passportAuthenticate, loggedInCartItemQuantity)

module.exports = router
