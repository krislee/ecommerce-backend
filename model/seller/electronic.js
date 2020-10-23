const {Schema, model} = require('mongoose')
const sellerUser = require('./sellerUser')

const electronicsSchema = new Schema ({
    Name: {type: String, required: true},
    Image: String,
    Brand: String,
    Description: {type: String, required: true},
    Price: {type: Number, required: true},
    Rating: Number,
    Review: [{type: Schema.Types.ObjectId, ref: "reviewElectronic"}],
    Seller: [{type: Schema.Types.ObjectId, ref: "SellerUser"}]
})

const electronics = model('electronic', electronicsSchema)

electronicsSchema.pre('deleteMany', async function() {
    await this.model('electronic').deleteOne({Seller: Seller[0]._id})
})

module.exports = electronics
