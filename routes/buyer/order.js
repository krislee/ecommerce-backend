const express = require('express');
const passport = require('passport');
const stripe = require("stripe")(`${process.env.STRIPE_SECRET}`)
const router = express.Router();

const Order = require('../../model/order')

passportAuthenticate = passport.authenticate('jwt', {session: false})

router.get('/list/orders/:id', async(req, res) => {
    const order = await Order.findById(req.params.id)
    console.log(11, order)
    res.status(200).json({order: order})
})

router.get('/order/payment-intent/:id', async(req, res) => {
    console.log(17, typeof req.params.id)
    const succeededPaymentIntent = await stripe.paymentIntents.retrieve(req.params.id)
    console.log(18, succeededPaymentIntent)
    const paymentMethod = await stripe.paymentMethods.retrieve(succeededPaymentIntent.payment_method)
    console.log(20, paymentMethod)
    res.status(200).json({
        orderNumber: paymentIntent.metadata.order_number,
        cardBrand: paymentMethod.card.brand,
        billingDetails: {
            name: paymentMethod.billingDetails.name,
            line1: paymentMethod.billingDetails.address.line1,
            line2: paymentMethod.billingDetails.address.line2,
            city: paymentMethod.billingDetails.address.city,
            state: paymentMethod.billingDetails.address.state,
            postalCode: paymentMethod.billingDetails.address.postal_code
        }
    })
})

module.exports = router
