const express = require('express');
const passport = require('passport');
const router = express.Router();

const Order = require('../../model/order')

passportAuthenticate = passport.authenticate('jwt', {session: false})

router.get('/order/:id', async(req, res) => {
    console.log(10)
    console.log(11, req.params.id)
    const order = Order.findOne({CartID: req.params.id})
    res.status(200).json({order: order})
})

module.exports = router
