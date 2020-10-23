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
    electronicItems: [{type: Schema.Types.ObjectId, ref: "electronic"}],
    clothingItems: [{type: Schema.Types.ObjectId, ref: "clothing"}],
    healthItems: [{type: Schema.Types.ObjectId, ref: "health"}]
})

/* Resources for remove and deleteOne pre hooks: 
https://www.youtube.com/watch?v=5iz69Wq_77k&ab_channel=IanSchoonover

https://stackoverflow.com/questions/11904159/automatically-remove-referencing-objects-on-deletion-in-mongodb

https://stackoverflow.com/questions/60006362/mongoose-middleware-pre-deleteone-options-not-working

https://mongoosejs.com/docs/middleware.html
*/

// Need {document: true} in order to run the deleteOne pre hook middleware because by default deleteOne pre hook this refers to a query and not a document. To register deleteOne middleware as document middleware instead of query middleware, use schema.pre('updateOne', { document: true, query: false }).
sellerUserSchema.pre('deleteOne', { document: true, query: false}, async function(next) {
    try {

        // Delete all electronic documents that referenced to the removed seller
        // this.model("electronic") points to the documents in the electronic model that has a reference to the seller(this)
        await this.model("electronic").deleteMany({Seller: this._id})

        /* Could have also ran remove pre hook middleware instead of deleteOne pre hook middleware which will run with the route handler function containing seller.remove()
        await Electronics.remove({_id: {$in: this.electronicItems}}) */

        // Since pre hook is a middleware, continue running the route handler function with next()
        next()
    } 
    catch (error) {
        next(error)
    }
})

const SellerUser = model('SellerUser',sellerUserSchema)

module.exports = {SellerUser}