const {Schema, model} = require('mongoose')

const buyerShippingAddressSchema = new Schema({
    Name: {type: String, min: 8, max: 255, required: true},
    Address: {type: String, max: 255, required: true},
    DefaultAddress: {type: Boolean, default: false},
    LastUsed: {type: Boolean, default: false},
    Buyer: [{type: Schema.Types.ObjectId, ref: "BuyerUser"}]
})

const BuyerShippingAddress = model('BuyerShippingAddress', buyerShippingAddressSchema)

module.exports = {BuyerShippingAddress}