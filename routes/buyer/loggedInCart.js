const router = require('express').Router();
const passport = require('passport');
const passportAuthenticate = passport.authenticate('jwt', {session: false}, async(req, res, next) => {
    console.log(4, "PASSPORT AUTHENTICATE REQ\n------------\n", req)
    console.log(5, "PASSPORT AUTHENTICATE RES\n------------\n", res)
    next()
})

const {loggedInAddItem, loggedInUpdateItemQuantity, loggedInDeleteItem, loggedInIndexCart, loggedInCartItemQuantity} = require('../../controller/buyer/loggedInCart')

router.post('/:id', passportAuthenticate, loggedInAddItem)

router.put('/update/:id', passportAuthenticate, loggedInUpdateItemQuantity)

router.delete('/delete/:id', passportAuthenticate, loggedInDeleteItem)

router.get('/cart', passportAuthenticate, loggedInIndexCart)

router.get('/quantity/:id', passportAuthenticate, loggedInCartItemQuantity)

module.exports = router
