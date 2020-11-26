const express = require('express');
const router = express.Router();

const {guestAddItem, guestUpdateItemQuantity, guestDeleteItem, guestIndexCart} = require('../../controller/buyer/guestCart')

router.post('/:id', guestAddItem)

router.put('/update/:id', passportAuthenticate, guestUpdateItemQuantity)

router.delete('/delete/:id', passportAuthenticate, guestDeleteItem)

router.get('/cart/:id', passportAuthenticate, guestIndexCart)

module.exports = router