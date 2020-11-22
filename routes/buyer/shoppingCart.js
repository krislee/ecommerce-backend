const express = require('express');
const passport = require('passport');
const {indexCart, addOrUpdateItem, updateItemQuantity, deleteItem} = require('../../controller/buyer/shoppingCart');

const router = express.Router();

router.get('/electronic/cart', indexCart)

router.post('/electronic/cart/:id', addOrUpdateItem)

router.put('/electronic/cart/:id', updateItemQuantity)

router.delete('/electronic/cart/:id', deleteItem)



module.exports = router