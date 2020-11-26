const express = require('express');
const passport = require('passport');
const router = express.Router();
const {Electronic} = require('../../model/seller/electronic')
const Cart = require('../../model/buyer/cart');
const cartController2 = require('./loggedInCart')

const {loggedInIndexCart, guestIndexCart, loggedInAddItem, guestAddItem, loggedInUpdateItemQuantity, guestUpdateItemQuantity, loggedInDeleteItem, guestDeleteItem} = require('../../controller/buyer/shoppingCart');
const passportAuthenticate = passport.authenticate('jwt', {session: false})

router.get('/electronic/cart', passportAuthenticate, loggedInIndexCart, guestIndexCart)

// router.post('/electronic/cart/:id', passportAuthenticate, (req, res) => {
//     res.redirect(307, '/loggedIn/cart/')
// })

// router.post('/electronic/cart/:id', passportAuthenticate, (req, res) => {
//     console.log(req.user)
//     if(res.status(401)) {console.log(req.user)}
// })

router.post('/electronic/cart/:id', async (req, res, next) => {
    if(!req.headers.authorization) {
        // res.send("guest")
        try {
            // if user is not logged in, then there would be no req.user obj and the following would run
            
                const item = await Electronic.findById(req.params.id)
    
                console.log(item, "guest trying to add item")
    
                // if a cart has been made for the guest user, then check if the item is already in the cart 
                if(req.session.cart) {
                    const cartItem = req.session.cart.find(i => i.Id == item.id)
                    
                    // if item exists in the cart, update quantity and total price
                    if (cartItem) { 
                        cartItem.Quantity += req.body.Quantity
                        cartItem.TotalPrice = cartItem.Quantity * item.Price
                    } else { // if item does not exists, then add the item to the cart
                        req.session.cart.push({
                            Id: item.id,
                            Name: item.Name,
                            Brand: item.Brand,
                            Image: item.Image,
                            Quantity: req.body.Quantity,
                            TotalPrice: req.body.Quantity * item.Price
                        })
                    }
    
                    console.log(req.session.cart, "guest cart after adding item")
                    res.status(200).json(req.session.cart);
    
                } else { // if the cart has not been made for the guest user, then make the cart with the item user is adding
                    req.session.cart = 
                        [{
                            Id: item.id,
                            Name: item.Name,
                            Image: item.Image,
                            Brand: item.Brand,
                            Quantity: req.body.Quantity,
                            TotalPrice: req.body.Quantity * item.Price
                        }]
                    
                    console.log(req.session.cart, "guest cart made to add item")
                    res.status(200).json(req.session.cart);
                }
        }
        catch (error) {
            console.log(error, "error of guest")
            res.status(400).send(error)
        }
    } else {
        console.log("else")
        res.redirect(307, '/guest/cart')
    }
});

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