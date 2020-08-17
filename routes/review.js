const express = require('express');
const electronicReviewRouter = express.Router();
const {create} = require('../controller/review');

electronicReviewRouter.post('/electronic/review', create)

module.exports = electronicReviewRouter