const express = require('express');
const router = express.Router();

const {electronicIndex, electronicShow} = require('../../controller/store');
const {allStoreItemReviews} = require('../../controller/buyer/electronicReview')

router.get('/electronic', electronicIndex)

router.get('/electronic/:id', electronicShow)

router.get('/electronic/public-reviews/:id', allStoreItemReviews)


module.exports = router