const express = require('express');
const passport = require('passport');
const { default: Stripe } = require('stripe');
const stripe = require("stripe")(`${process.env.STRIPE_SECRET}`)
const router = express.Router();

const Order = require('../../model/order')

passportAuthenticate = passport.authenticate('jwt', {session: false})

router.get('/list/orders', passportAuthenticate, async(req, res) => {
    console.log(12)
    const totalOrders = await Order.find({LoggedInBuyer: req.user._id, Complete: true}).countDocuments() // find the orders that belong to the logged in buyer (loggedIn buyer's info resides in req.user), and then count the number of order items docs returned
    console.log(14, totalOrders)
    const {limit = 5, page = 1} = req.query // set default values to limit and page for pagination
    console.log(16)
    const allOrders = await Order.find({LoggedInBuyer: req.user._id, Complete: true}).sort({ _id: -1 }).limit(limit*1).skip((page-1) * limit)

    console.log(18, allOrders)

    return res.status(200).json({
        orders: allOrders,
        totalPages: Math.ceil(totalOrders/limit),
        currentPage: page //page is received from req.query i.e. route would be localhost:3000/complete/list/orders?page=2, and the page number is 2
    });
})

router.get('/list/orders/:id', async(req, res) => {
    console.log(29, req.params.id)
    const order = await Order.findOne({OrderNumber: req.params.id})
    const paymentMethod = await stripe.paymentMethods.retrieve(order.PaymentMethod)

    console.log(30, order)
    console.log(34, paymentMethod)

    return res.status(200).json({
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
