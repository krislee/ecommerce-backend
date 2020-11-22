const express = require('express');
const passport = require('passport');
const {addOrUpdateItem, updateItemQuantity, deleteItem} = require('../../controller/buyer/shoppingCart');

const router = express.Router();

router.post('/electronic/cart/:id', addOrUpdateItem)

router.put('/electronic/cart/:id', passportAuthenticate, updateItemQuantity)

router.delete('/electronic/cart/:id', passportAuthenticate, deleteItem)



module.exports = router