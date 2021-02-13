const express = require('express');
const passport = require('passport');
const router = express.Router();

const Order = require('../../model/order')

passportAuthenticate = passport.authenticate('jwt', {session: false})

router.get('/orders/:id', async(req, res) => {
    const order = await Order.findById(req.params.id)
    console.log(11, order)
    res.status(200).json({order: order})
})

module.exports = router
