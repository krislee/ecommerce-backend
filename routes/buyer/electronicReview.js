const express = require('express');
const passport = require('passport');
const {index, show, create, update, destroy} = require('../../controller/buyer/electronicReview');

const router = express.Router();
const passportAuthenticate = passport.authenticate('jwt', {session: false})

router.get('/all/electronic/reviews', passportAuthenticate, index)

router.get('/electronic/review/:id', passportAuthenticate, show)

router.post('/electronic/review/:electronicId', passportAuthenticate, create)

router.put('/electronic/review/:id', passportAuthenticate, update)

router.delete('/electronic/review/:id', passportAuthenticate, destroy)



module.exports = router 