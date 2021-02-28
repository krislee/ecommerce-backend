const {Schema, model} = require('mongoose')

const buyerShippingAddressSchema = new Schema({
    Name: {type: String, min: 8, max: 255, required: true},
    Address: {type: String, max: 255, required: true},
    Phone: Number,
    DefaultAddress: {type: Boolean, required: true, default: false},
    LastUsed: {type: Boolean, required: true, default: false},
    Buyer: [{type: Schema.Types.ObjectId, ref: "BuyerUser"}]
})

const BuyerShippingAddress = model('BuyerShippingAddress', buyerShippingAddressSchema)

module.exports = {BuyerShippingAddress}