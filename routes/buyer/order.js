const express = require('express');
const passport = require('passport');
const router = express.Router();

const Order = require('../../model/order')

passportAuthenticate = passport.authenticate('jwt', {session: false})

router.get('/:id', async(res, req) => {
    const order = Order.findOne({CartID: req.params.id})
    res.status(200).json({order: order})
})

module.exports = router
