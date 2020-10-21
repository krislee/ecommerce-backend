const {Schema, model} = require('mongoose')

const electronicsSchema = new Schema ({
    Name: {type: String, required: true},
    Image: String,
    Brand: String,
    Description: {type: String, required: true},
    Price: {type: Number, required: true},
    Rating: Number,
    Review: [{type: Schema.Types.ObjectId, ref: "reviewElectronic"}],
    Seller: [{type: Schema.Types.ObjectId, ref: "User"}]
})

const electronics = model('electronic', electronicsSchema)
module.exports = electronics
