const {Schema, model} = require ('mongoose')

const reviewClothingSchema = new Schema (
    {
        ClothingItem: [{type: Schema.Types.ObjectId, ref: "clothing"}],
        Name: {type: String, required: true},
        Comment: {type: String, required: true},
        Rating: {type: Number, required: true},
    }
)

const reviewClothing = model('reviewClothing', reviewClothingSchema);
module.exports = reviewClothing;