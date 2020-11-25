const express = require('express');
const passport = require('passport');
const router = express.Router();
const {loggedInIndexCart, guestIndexCart, loggedInAddItem, guestAddItem, loggedInUpdateItemQuantity, guestUpdateItemQuantity, loggedInDeleteItem, guestDeleteItem} = require('../../controller/buyer/shoppingCart');
const passportAuthenticate = passport.authenticate('jwt', {session: false})

router.get('/electronic/cart', passportAuthenticate, loggedInIndexCart, guestIndexCart)

router.post('/electronic/cart/:id', passportAuthenticate, (req, res) => {
    res.redirect(307, '/loggedIn/cart')
})

router.put('/electronic/cart/:id', guestUpdateItemQuantity, passportAuthenticate, loggedInUpdateItemQuantity)

router.delete('/electronic/cart/:id', guestDeleteItem, passportAuthenticate, loggedInDeleteItem)

// router.post('/electronic/cart/:id', (req,res) => {
//     passport.authenticate('jwt', (err, user) => {
//         console.log(1)
//         if(!user) {
//             console.log("hi")
//             return res.redirect('/guest/cart')
//         }else {
//             console.log("bye")
//             loggedInAddItem()
//         }
//     })
// })


module.exports = router