const express = require('express');
const passport = require('passport');
const { default: Stripe } = require('stripe');
const stripe = require("stripe")(`${process.env.STRIPE_SECRET}`)
const router = express.Router();

const Order = require('../../model/order')

passportAuthenticate = passport.authenticate('jwt', {session: false})

router.get('/list/orders', passportAuthenticate, async(req, res) => {
    const orders = await Order.find({LoggedInBuyer: req.user._id, Items: { $where: 'this.Items.length>0' }})
    console.log(40, orders)
    res.status(200).json({orders: orders})
})

router.get('/list/orders/:id', async(req, res) => {
    const order = await Order.findOne({OrderNumber: req.params.id})
    const paymentMethod = await stripe.paymentMethods.retrieve(order.PaymentMethod)

    console.log(15, order)
    console.log(16, paymentMethod)

    res.status(200).json({
        order: order, 
        payment: {
            brand: paymentMethod.card.brand,
            last4: paymentMethod.card.last4,
            billingDetails: {
                address: {
                    line1: paymentMethod.billing_details.address.line1,
                    line2: paymentMethod.billing_details.address.line2,
                    city:  paymentMethod.billing_details.address.city,
                    state:  paymentMethod.billing_details.address.state,
                    postalCode:  paymentMethod.billing_details.address.postal_code,
                    country:  paymentMethod.billing_details.address.country
                },
                name: paymentMethod.billing_details.name
            }
        }
    })
})




module.exports = router
