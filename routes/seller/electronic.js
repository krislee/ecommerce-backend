const express = require('express');
const electronicRouter = express.Router();
const {create, index, show, update} = require('../../controller/seller/electronic');

electronicRouter.get('/electronic', index)

electronicRouter.get('/electronic/:id', show)

electronicRouter.post('/electronic', create)

electronicRouter.put('/electronic/:id', update);

module.exports = electronicRouter