const express = require('express');
const electronicRouter = express.Router();
const {create} = require('../controller/sellerElectronic');

electronicRouter.post('/electronic', create)

module.exports = electronicRouter