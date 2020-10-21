const {Schema, model} = require ('mongoose')

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

const reviewElectronic = model('reviewElectronic', reviewElectronicSchema);
module.exports = reviewElectronic;