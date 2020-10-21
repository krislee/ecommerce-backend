const {Schema, model} = require('mongoose')
const buyerUserSchema = new Schema({
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
    // Create relationship between buyer and its reviews
    electronicReviews: [{type: Schema.Types.ObjectId, ref: "reviewElectronic"}],
    clothingReviews: [{type: Schema.Types.ObjectId, ref: "reviewClothing"}],
    healthReviews: [{type: Schema.Types.ObjectId, ref: "reviewHealth"}]
})

module.exports = model('BuyerUser', buyerUserSchema)