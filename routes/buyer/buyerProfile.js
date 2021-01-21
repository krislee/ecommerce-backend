const express = require('express');
const passport = require('passport');
const router = express.Router();
const {index, update, destroy} = require('../../controller/buyer/buyerProfile');
const {updateUserShipping, addUserShipping, indexUserShipping, showUserShipping} = require('../../controller/buyer/shippingAddress')

passportAuthenticate = passport.authenticate('jwt', {session: false})


router.get('/profile', passportAuthenticate, index)

router.put('/profile', passportAuthenticate, update);

router.delete('/profile', passportAuthenticate, destroy);


router.put('/address/:id', passportAuthenticate, updateUserShipping)

router.post('/address', passportAuthenticate, addUserShipping)

router.get('/address', passportAuthenticate, indexUserShipping)

router.get('/address/:id', passportAuthenticate, showUserShipping)

module.exports = router