const express = require('express');
const router = express.Router();
const {index, create, update, destroy} = require('../../controller/buyer/healthReview');


router.get('/health/review/:healthId', index)

router.post('/health/review', create)

router.put('/health/review/:id', update)

router.delete('/health/review/:id', destroy)


module.exports = router