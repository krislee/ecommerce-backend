const {Schema, model} = require('mongoose')
const buyerUser = require('../buyer/buyerUser')
const {ElectronicReview} = require('../buyer/reviewElectronic')
const electronicsSchema = new Schema ({
    Name: {type: String, required: true},
    Image: [String],
    Brand: {type: String, required: true},
    Quantity: {type: Number, required: true},
    GeneralDescription: {type: String, required: true},
    Description: [{
        Heading: String,
        Paragraph: String,
        OwnPage: Boolean,
        Image: String,
        Bullet: Boolean
    }],
    Price: {type: Number, required: true},
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

        // Need to Delete all the electronic descriptions
    }
    catch (error) {
        next(error)
    }
})

electronicsSchema.pre('deleteOne',  { document: false, query: true }, async function(next) {
    try {
        
        // Delete reviews that have a reference to the id of the electronic item
        await ElectronicReview.deleteMany({ElectronicItem: this._id})

        // Need to Delete all the electronic descriptions

        // Continue running the delete electronic route 
        next()
    }
    catch (error) {
        next(error)
    }
})
const Electronic = model('electronic', electronicsSchema)



module.exports = {Electronic, electronicsSchema}
