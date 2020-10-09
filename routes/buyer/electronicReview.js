const express = require('express');
const router = express.Router();
const {index, create, update, destroy} = require('../../controller/buyer/electronicReview');

router.get('/electronic/review/:electronicId', index)

router.post('/electronic/review', create)

router.put('/electronic/review/:id', update)

router.delete('/electronic/review/:id', destroy)



module.exports = router