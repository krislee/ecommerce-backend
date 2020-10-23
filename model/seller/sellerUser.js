const {Schema, model} = require('mongoose')
const Electronics = require('../seller/electronic')
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

// Need {document: true} in order to run the deleteOne pre hook middleware
sellerUserSchema.pre('deleteOne', { document: true }, async function(next) {
    try {
        console.log(this, "this")

        // Delete all electronic documents that referenced to the removed seller
        await this.model("electronic").deleteMany({Seller: this._id})

        /* Could have also ran remove pre hook middleware instead of deleteOne pre hook middleware which will run with the route handler function containing seller.remove()
        await Electronics.remove({_id: {$in: this.electronicItems}}) */

        // Since pre hook is a middleware, continue running the route handler function with next()
        next()
    } catch (error) {
        next(error)
    }
})

const SellerUser = model('SellerUser',sellerUserSchema)

module.exports = {SellerUser}