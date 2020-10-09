const express = require('express');
const router = express.Router();
const {index, create, update, destroy} = require('../../controller/buyer/clothingReview');


router.get('/clothing/review/:clothingId', index)

router.post('/clothing/review', create)

router.put('/clothing/review/:id', update)

router.delete('/clothing/review/:id', destroy)


module.exports = router