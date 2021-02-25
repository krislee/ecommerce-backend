const {Schema, model} = require('mongoose')
const buyerUser = require('../buyer/buyerUser')
const {ElectronicReview} = require('../buyer/reviewElectronic')
const electronicsSchema = new Schema ({
    Name: {type: String, required: true},
    Image: [String],
    Brand: String,
    Description: [{
        Heading: String,
        Paragraph: String
    }],
    Price: {type: Number, required: true},
    Rating: Number,
    // Review: [{type: Schema.Types.ObjectId, ref: "reviewElectronic"}],
    Quantity: Number,
    Seller: [{type: Schema.Types.ObjectId, ref: "SellerUser"}]
})

// Credit: https://github.com/Automattic/mongoose/issues/9152

electronicsSchema.pre('deleteMany', { document: false, query: true }, async function(next) {
    try {
        console.log(this.model, "this.model for deleting electronic reviews when deleting seller")
        
        // Finds all the electronic documents that matches the query: {Seller: idOfSeller}. In other words, finding all the electronic items the seller made.
        const docs = await this.model.find(this.getFilter()) // this.getFilter() returns {Seller: idOfSeller}

        // For each of the electronic items, get the ids of the electronic documents and store them in an array.
        const electronicItems = docs.map(item => item._id)

        // Delete all the electronic review documents from reviewElectronic model that has the electronic document id
        await ElectronicReview.deleteMany({ElectronicItem: {$in: electronicItems}})
    }
    catch (error) {
        next(error)
    }
})

electronicsSchema.pre('deleteOne',  { document: false, query: true }, async function(next) {
    try {
        
        // Delete reviews that have a reference to the id of the electronic item
        await ElectronicReview.deleteMany({ElectronicItem: this._id})

        // Continue running the delete electronic route 
        next()
    }
    catch (error) {
        next(error)
    }
})
const Electronic = model('electronic', electronicsSchema)



module.exports = {Electronic, electronicsSchema}
