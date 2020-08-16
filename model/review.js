const {Schema, model} = require ('mongoose')

const reviewSchema = new Schema (
    {
        electronicItem: [{type: Schema.Types.ObjectId, ref: "electronic"}],
        healthItem: [{type: Schema.Types.ObjectId, ref: "health"}],
        clothingItem: [{type: Schema.Types.ObjectId, ref: "clothing"}],
        Name: String,
        Comment: String,
        Rating: Number
    }
)

const review = model('review', reviewSchema);
module.exports = review;