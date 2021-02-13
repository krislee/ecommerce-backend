const express = require('express');
const passport = require('passport');
const stripe = require("stripe")(`${process.env.STRIPE_SECRET}`)
const router = express.Router();

const Order = require('../../model/order')

passportAuthenticate = passport.authenticate('jwt', {session: false})

router.get('/list/orders/:id', async(req, res) => {
    const order = await Order.findOne({OrderNumber: req.params.id})
    console.log(11, order)
    res.status(200).json({order: order})
})

// router.get('/order/payment-intent/:id', async(req, res) => {
//     console.log(17, typeof req.params.id)
//     const succeededPaymentIntent = await stripe.paymentIntents.retrieve(req.params.id)
//     console.log(18, succeededPaymentIntent)
//     const paymentMethod = await stripe.paymentMethods.retrieve(succeededPaymentIntent.payment_method)
//     console.log(20, paymentMethod)
//     console.log(22, paymentMethod.billingDetails)
//     res.status(200).json({
//         orderNumber: succeededPaymentIntent.metadata.order_number,
//         cardBrand: paymentMethod.card.brand,
//         billingDetails: {
//             name: paymentMethod.billing_details.name,
//             line1: paymentMethod.billing_details.address.line1,
//             line2: paymentMethod.billing_details.address.line2,
//             city: paymentMethod.billing_details.address.city,
//             state: paymentMethod.billing_details.address.state,
//             postalCode: paymentMethod.billing_details.address.postal_code
//         }
//     })
// })

module.exports = router
