const express = require('express');
const passport = require('passport');
const {index, create, update, destroy} = require('../../controller/buyer/electronicReview');

const router = express.Router();
const passportAuthenticate = passport.authenticate('jwt', {session: false})

router.get('/electronic/review', passportAuthenticate, index)

router.post('/electronic/review/:electronicId', passportAuthenticate, create)

router.put('/electronic/review/:id', passportAuthenticate, update)

router.delete('/electronic/review/:id', passportAuthenticate, destroy)



module.exports = router