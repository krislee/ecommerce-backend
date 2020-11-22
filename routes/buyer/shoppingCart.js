const express = require('express');
const passport = require('passport');
const {indexCart, addOrUpdateItem, updateItemQuantity, deleteItem} = require('../../controller/buyer/shoppingCart');

const router = express.Router();

router.get('/electronic/cart', passportAuthenticate, indexCart)

router.post('/electronic/cart/:id', passportAuthenticate, addOrUpdateItem)

router.put('/electronic/cart/:id', passportAuthenticate, updateItemQuantity)

router.delete('/electronic/cart/:id', passportAuthenticate, deleteItem)



module.exports = router