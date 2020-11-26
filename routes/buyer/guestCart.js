const express = require('express');
const router = express.Router();

const {guestAddItem, guestUpdateItemQuantity, guestDeleteItem, guestIndexCart} = require('../../controller/buyer/guestCart')

router.post('/:id', guestAddItem)

router.put('/update/:id', guestUpdateItemQuantity)

router.delete('/delete/:id', guestDeleteItem)

router.get('/cart/:id', guestIndexCart)

module.exports = router