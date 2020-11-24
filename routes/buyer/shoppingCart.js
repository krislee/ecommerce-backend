const express = require('express');
const passport = require('passport');
const router = express.Router();
const {loggedInIndexCart, guestIndexCart, loggedInAddItem, guestAddItem, loggedInUpdateItemQuantity, guestUpdateItemQuantity, loggedInDeleteItem, guestDeleteItem} = require('../../controller/buyer/shoppingCart');
const passportAuthenticate = passport.authenticate('jwt', {session: false, 
        failureRedirect: '/guest'})

router.get('/electronic/cart', passportAuthenticate, loggedInIndexCart, guestIndexCart)

router.post('/electronic/cart/:id', function(req, res) {
    passport.authenticate('jwt', (err, user, info) => {
        if (err) { console.log(err); }
        console.log(user, 'user from shopping cart');
        if (!user) {return res.redirect('/guest'); }
    })
} 
)

router.put('/electronic/cart/:id', guestUpdateItemQuantity, passportAuthenticate, loggedInUpdateItemQuantity)

router.delete('/electronic/cart/:id', guestDeleteItem, passportAuthenticate, loggedInDeleteItem)



module.exports = router