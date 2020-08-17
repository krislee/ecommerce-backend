const {Schema, model} = require('mongoose')

const electronicsSchema = new Schema ({
    Name: String,
    Image: String,
    Brand: String,
    Description: String,
    Price: Number,
    Rating: Number,
    Review: [{type: Schema.Types.ObjectId, ref: "reviewElectronic"}]
})

const electronics = model('electronic', electronicsSchema)
module.exports = electronics
