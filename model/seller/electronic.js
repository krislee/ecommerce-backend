const {Schema, model} = require('mongoose')
const {ElectronicReview} = require('../buyer/reviewElectronic')
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

// Credit: https://github.com/Automattic/mongoose/issues/9152

electronicsSchema.pre('deleteMany', { document: false, query: true }, async function(next) {
    try {

        // Finds all the electronic documents that matches the query: {Seller: idOfSeller}
        const docs = await this.model.find(this.getFilter()) // this.getFilter() returns {Seller: idOfSeller}

        // Make an array with electronic documents ids
        const electronicItems = docs.map(item => item._id)

        // Delete all the electronic review documents from reviewElectronic model that has the electronic document id
        await ElectronicReview.deleteMany({ElectronicItem: {$in: electronicItems}})
    }
    catch (error) {
        next(error)
    }
})

const Electronic = model('electronic', electronicsSchema)



module.exports = {Electronic, electronicsSchema}
