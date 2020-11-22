const express = require('express');
const passport = require('passport');
const {addOrUpdateItem, updateItemQuantity, deleteItem} = require('../../controller/buyer/shoppingCart');

const router = express.Router();

router.post('/electronic/review/:electronicId', passportAuthenticate, addOrUpdateItem)

router.put('/electronic/review/:id', passportAuthenticate, updateItemQuantity)

router.delete('/electronic/review/:id', passportAuthenticate, deleteItem)



module.exports = router