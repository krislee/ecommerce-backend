const express = require('express');
const electronicRouter = express.Router();
const {create, index} = require('../controller/sellerElectronic');

electronicRouter.get('/electronic', index)

electronicRouter.post('/electronic', create)

module.exports = electronicRouter