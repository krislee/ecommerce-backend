const {Schema, model} = require ('mongoose');

// Schema makes sure data going in and out of the db matches the Schema
const clothingSchema = new Schema (
    {
        Name: String,
        Image: String,
        Brand: String,
        Description: String,
        Price: Number,
        Rating: Number,
        Review: [{type: Schema.Types.ObjectId, ref: "reviewClothing"}] // make an association for another model, reviewClothing
    }
)

const clothing = model('clothing', clothingSchema) // model function connects Schema with db

module.exports = clothing