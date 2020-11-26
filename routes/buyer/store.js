const express = require('express');
const router = express.Router();

const {electronicIndex, electronicShow} = require('../../controller/store');


router.get('/electronic', electronicIndex)

router.get('/electronic/:id', electronicShow)




module.exports = router