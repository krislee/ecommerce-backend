const {Schema, model} = require ('mongoose')
const Buyer = require('../buyer/buyerUser')

// 1 buyer has many reviews
// 1 item has many reviews 
// 1 review belongs to 1 buyer and 1 item
const reviewElectronicSchema = new Schema (
    {
        Name: {type: String, required: true},
        Comment: {type: String, required: true},
        Rating: {type: Number, required: true},
        ElectronicItem: [{type: Schema.Types.ObjectId, ref: "electronic"}], 
        Buyer: [{type: Schema.Types.ObjectId, ref: "BuyerUser"}]
    }
)

reviewElectronicSchema.pre('deleteMany', { document: false, query: true}, async function(next) {
    console.log(this.getFilter(), "getfilter")
    const reviewsDocs = await this.model.find(this.getFilter())
    console.log(reviewDocs, "reviewDocs")
    const arrayOfReviewId = reviewsDocs.map(review => review._id)
    console.log(arrayOfReviewId, "array")
    await Buyer.deleteMany({electronicReviews: {$in: arrayOfReviewId}})    
})

const ElectronicReview = model('reviewElectronic', reviewElectronicSchema);
module.exports = {ElectronicReview, reviewElectronicSchema};