const {Schema, model} = require ('mongoose')

const reviewClothingSchema = new Schema (
    {
        ClothingItem: [{type: Schema.Types.ObjectId, ref: "clothing"}],
        Name: String,
        Comment: String,
        Rating: Number
    }
)

const reviewClothing = model('reviewClothing', reviewClothingSchema);
module.exports = reviewClothing;