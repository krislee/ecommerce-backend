const express = require('express');
const router = express.Router();

const {index, show} = require('../../controller/seller/electronic');
const electronicIndex = index
const electronicShow = show

const clothingIndex = require('../../controller/seller/clothing').index;
const clothingShow = require('../../controller/seller/clothing').show;


const healthIndex = require('../../controller/seller/health').index;
const healthShow = require('../../controller/seller/health').show;


router.get('/electronic', electronicIndex)

router.get('/electronic/:id', electronicShow)

router.get('/clothing', clothingIndex)

router.get('/clothing/:id', clothingShow)

router.get('/health', healthIndex)

router.get('/health/:id', healthShow)



module.exports = router