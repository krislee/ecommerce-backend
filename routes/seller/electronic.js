const express = require('express');
const passport = require('passport');
const router = express.Router();
const {index, show, create, update, destroy} = require('../../controller/seller/electronic');

router.get('/electronic', passport.authenticate('jwt', {session: false}), index)

router.get('/electronic/:id', show)

router.post('/electronic', create)

router.put('/electronic/:id', update);

router.delete('/electronic/:id', destroy);

module.exports = router