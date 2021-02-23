const express = require('express');
const router = express.Router();

const {guestAddItem, guestUpdateItemQuantity, guestDeleteItem, guestIndexCart, guestCartItemQuantity} = require('../../controller/buyer/guestCart')

router.post('/post/:id', guestAddItem)

router.put('/update/:id', guestUpdateItemQuantity)

router.delete('/delete/:id', guestDeleteItem)

router.get('/cart', guestIndexCart)

router.get('/quantity/:id', guestCartItemQuantity)

module.exports = router