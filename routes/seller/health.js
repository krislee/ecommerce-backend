const express = require('express');
const router = express.Router();
const {index, show, create, update, destroy} = require('../../controller/seller/health');

router.get('/health', index)

router.get('/health/:id', show)

router.post('/health', create)

router.put('/health/:id', update);

router.delete('/health/:id', destroy);

module.exports = router