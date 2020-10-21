const {Schema, model} = require('mongoose')
const sellerUserSchema = new Schema({
    username: {
        type: String,
        required: true,
        min: 8,
        max: 255
    },
    email: {
        type: String,
        required: true,
        min: 8,
        max: 255
    },
    password: {
        type: String,
        required: true,
        max: 1024,
        min: 8
    },
    date: {
        type: Date,
        default: Date.now()
    },
    seller: {
        type: Boolean, 
        required: true
    },
    // Create relationship between seller and seller's items
    electronicItems: [{type: Schema.Types.ObjectId, ref: "electronics"}],
    clothingItems: [{type: Schema.Types.ObjectId, ref: "clothing"}],
    healthItems: [{type: Schema.Types.ObjectId, ref: "health"}]
})

module.exports = model('SellerUser',sellerUserSchema)