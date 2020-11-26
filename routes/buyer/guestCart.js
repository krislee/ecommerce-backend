const express = require('express');
const router = express.Router();

const {guestAddItem} = require('../../controller/buyer/guestCart')

router.post('/:id', guestAddItem)

module.exports = router