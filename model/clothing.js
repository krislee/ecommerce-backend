const {Schema, model} = require ('mongoose');

const clothingSchema = new Schema (
    {
        Name: String,
        Image: String,
        Brand: String,
        Description: String,
        Price: Number,
        Rating: Number,
        Review: [{type: Schema.Types.ObjectId, ref: "review"}]
    }
)

const clothing = model('clothing', clothingSchema)

module.exports = clothing