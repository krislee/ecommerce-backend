const {Schema, model} = require('mongoose')

const orderSchema = new Schema({
    Items: [{
        ItemId: String,
        Name: String,
        Image: String,
        Brand: String,
        Quantity: Number,
        TotalPrice: Number
    }],
    Shipping: {
        Name: String,
        Address: String
    },
    PaymentMethod: String,
    TotalPrice: Number,
    OrderNumber: String
})

const Order = model('order', orderSchema)
module.exports = Order