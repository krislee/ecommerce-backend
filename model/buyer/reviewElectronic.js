const {Schema, model} = require ('mongoose')

// 1 buyer has many reviews
// 1 item has many reviews 
// 1 review belongs to 1 buyer and 1 item
const reviewElectronicSchema = new Schema (
    {
        ElectronicItem: [{type: Schema.Types.ObjectId, ref: "electronic"}], 
        Name: String,
        Comment: String,
        Rating: Number
    }
)

const reviewElectronic = model('reviewElectronic', reviewElectronicSchema);
module.exports = reviewElectronic;