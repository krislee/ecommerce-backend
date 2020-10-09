const express = require('express');
const router = express.Router();
const {index, show, create, update, destroy} = require('../../controller/seller/clothing');

router.get('/clothing', index)

router.get('/clothing/:id', show)

router.post('/clothing', create)

router.put('/clothing/:id', update);

router.delete('/clothing/:id', destroy);

module.exports = router