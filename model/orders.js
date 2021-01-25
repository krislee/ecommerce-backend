const {Schema, model} = require('mongoose')
const { v4: uuidv4 } = require('uuid');

const orderSchema = new Schema({
    Items: [{
        ItemId: String,
        Name: String,
        Image: String,
        Brand: String,
        Quantity: Number,
        TotalPrice: Number
    }],
    Buyer: [{type: Schema.Types.ObjectId, ref: "BuyerUser"}],
    OrderNumber: uuidv4()
})

const Order = model('order', orderSchema)
module.exports = Order