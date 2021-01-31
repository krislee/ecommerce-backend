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
    LoggedInBuyer: [{type: Schema.Types.ObjectId, ref: "BuyerUser"}],
    OrderNumber: String
})

const Order = model('order', orderSchema)
module.exports = Order