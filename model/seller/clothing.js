const {Schema, model} = require ('mongoose');

// Schema makes sure data going in and out of the db matches the Schema
const clothingSchema = new Schema (
    {
        Name: {type: String, required: true},
        Image: String,
        Brand: String,
        Description: {type: String, required: true},
        Price: {type: Number, required: true},
        Rating: Number,
        Review: [{type: Schema.Types.ObjectId, ref: "reviewClothing"}] // make an association for another model, reviewClothing
    }
)

const clothing = model('clothing', clothingSchema) // model function connects Schema with db

module.exports = clothing