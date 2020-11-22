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
    LoggedInBuyer: [{type: Schema.Types.ObjectId, ref: "BuyerUser"}],
    GuestBuyer: Number
})

const Cart = model('cart', cartSchema)
module.exports = Cart