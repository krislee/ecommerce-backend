const express = require('express');
const router = express.Router();

const {electronicIndex, electronicShow} = require('../../controller/store');


router.get('/electronic', electronicIndex)

router.get('/electronic/:id', electronicShow)

// router.get('/clothing', clothingIndex)

// router.get('/clothing/:id', clothingShow)

// router.get('/health', healthIndex)

// router.get('/health/:id', healthShow)



module.exports = router