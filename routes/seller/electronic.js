const express = require('express');
const electronicRouter = express.Router();
const {create, index, update} = require('../../controller/seller/electronic');

electronicRouter.get('/electronic', index)

electronicRouter.post('/electronic', create)

electronicRouter.put('/electronic/:id', update);

module.exports = electronicRouter