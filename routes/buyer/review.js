const express = require('express');
const electronicReviewRouter = express.Router();
const {index, create, update} = require('../../controller/buyer/electronicReview');

electronicReviewRouter.get('/electronic/review/:id', index)

electronicReviewRouter.post('/electronic/review', create)

electronicReviewRouter.put('/electronic/review/:id', update)

module.exports = electronicReviewRouter