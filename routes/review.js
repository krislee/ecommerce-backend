const express = require('express');
const electronicReviewRouter = express.Router();
const {create, update} = require('../controller/review');

electronicReviewRouter.post('/electronic/review', create)

electronicReviewRouter.put('/electronic/review/:id', update)

module.exports = electronicReviewRouter