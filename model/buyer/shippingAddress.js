const {Schema, model} = require('mongoose')

const buyerShippingAddressSchema = new Schema({
    Address: {type: String, max: 255},
    DefaultAddress: {type: Boolean, default: false},
    LastUsed: {type: Boolean, default: false},
    Buyer: [{type: Schema.Types.ObjectId, ref: "BuyerUser"}]
})

const BuyerShippingAddress = model('BuyerShippingAddress', buyerShippingAddressSchema)

module.exports = {BuyerShippingAddress}