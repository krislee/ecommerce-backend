const express = require('express');
const router = express.Router();
const passport = require('passport');

const {addItemsFromGuestToLoggedIn, getCartID, loggedInCartItemQuantity} = require('../../controller/buyer/loggedInCart')


const passportAuthenticate = passport.authenticate('jwt', {session: false})

router.post('/electronic/cart/:id', (req, res) => {
    console.log(10, req.headers.authorization)
    if(!req.headers.authorization) {
        res.redirect(307, `/guest/buyer/post/${req.params.id}`)
    } else {
        res.redirect(307, `/loginbuyer/${req.params.id}`)
    }
});

router.post('/sync/cart', passportAuthenticate, addItemsFromGuestToLoggedIn) // in the frontend, run the log in route, then store the JWT AND fetch this post route to add items
// router.post('/sync/cart',  addItemsFromGuestToLoggedIn)

router.put('/electronic/cart/:id', (req, res) => {
    if(!req.headers.authorization) {
        res.redirect(307, `/guest/buyer/update/${req.params.id}`)
    } else {
        res.redirect(307, `/loginbuyer/update/${req.params.id}`)
    }
})

router.delete('/electronic/cart/:id', (req, res) => {
    if(!req.headers.authorization) {
        res.redirect(307, `/guest/buyer/delete/${req.params.id}`)
    } else {
        res.redirect(307, `/loginbuyer/delete/${req.params.id}`)
    }
})

router.get('/cart', (req, res) => {
    if(!req.headers.authorization) {
        res.redirect(`/guest/buyer/cart`)
    } else {
        res.redirect(`/loginbuyer/cart`)
    }
})

router.get('/cartID', passportAuthenticate, getCartID)

router.get('/cart-item/:id', (req, res) => {
    console.log(48, "AUTHORIZATION IN SHOPPING CART ROUTE", req.headers.authorization)
    // console.log(49, "AUTHORIZATION", req.headers)
    // console.log(50, "-----: ", req.body)
    // console.log(51, "req.body.auth: ", req.body.Authorization)
    if(!req.headers.authorization) {
        res.redirect(307, `/guest/buyer/quantity/${req.params.id}`)
    } else {
        console.log(56, res)
        res.header('Authorization', req.headers.authorization)
        console.log(58, res)
        res.redirect(307, `/loginbuyer/quantity/${req.params.id}`)
    }
    
})

module.exports = router

// Resources:
// https://stackoverflow.com/questions/27056195/nodejs-express-validator-with-passport
// https://stackoverflow.com/questions/46094417/authenticating-the-request-header-with-express
// https://stackoverflow.com/questions/19146176/javascript-empty-array-evaluates-to-true-in-conditional-structures-why-is
// https://stackoverflow.com/questions/19035373/how-do-i-redirect-in-expressjs-while-passing-some-context
// https://stackoverflow.com/questions/59174763/how-to-add-product-to-shopping-cart-with-nodejs-express-and-mongoose
// https://stackoverflow.com/questions/38810114/node-js-with-express-how-to-redirect-a-post-request

// 5f96cb5123730104a225f9c3 - iphone 12
// 5f95a796ab49fe1565254ccb - samsung galaxy s10
// 5f96cb4a23730104a225f9c2 - lenovo legion 5
// 5f96cb4423730104a225f9c1 - sony
//