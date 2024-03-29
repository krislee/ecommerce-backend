const express = require('express');
const passport = require('passport');
const {index, show, create, update, destroy} = require('../../controller/seller/electronic');

const router = express.Router();
const passportAuthenticate = passport.authenticate('jwt', {session: false})


router.get('/electronic', passportAuthenticate, index)

router.get('/electronic/:id', passportAuthenticate, show)

router.post('/electronic', passportAuthenticate, create)

router.put('/electronic/:id', passportAuthenticate, update);

router.delete('/electronic/:id', passportAuthenticate, destroy);

module.exports = router