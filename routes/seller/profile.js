const express = require('express');
const router = express.Router();
const {index, update, destroy} = require('../../controller/seller/profile');


router.get('/profile', index)

router.put('/profile', update);

router.delete('/profile', destroy);

module.exports = router