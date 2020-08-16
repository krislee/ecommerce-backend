const {Schema, model} = require('mongoose')

const electronicsSchema = new Schema ({
    name: String,
    image: String,
    brand: String,
    description: String,
    price: Number,
    rating: [{type: Schema.Types.ObjectId, ref: "review"}]
})

const electronics = model('electronic', electronicsSchema)
module.exports = electronics