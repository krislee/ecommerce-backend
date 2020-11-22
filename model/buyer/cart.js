const {Schema, model} = require('mongoose')
const Electronic = require('../seller/electronic')

const cartSchema = new Schema({
    Items: [{
        Id: String,
        Name: String,
        Image: String,
        Brand: String,
        Quantity: Number,
        TotalPrice: Number
    }],
    Buyer: [{type: Schema.Types.ObjectId, ref: "BuyerUser"}]
})

const Cart = model('cart', cartSchema)
module.exports = Cart