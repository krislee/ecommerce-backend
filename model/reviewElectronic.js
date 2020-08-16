const {Schema, model} = require ('mongoose')

const reviewElectronicSchema = new Schema (
    {
        electronicItem: [{type: Schema.Types.ObjectId, ref: "electronic"}],
        Name: String,
        Comment: String,
        Rating: Number
    }
)

const reviewElectronic = model('reviewElectronic', reviewElectronicSchema);
module.exports = reviewElectronic;