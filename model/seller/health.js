const {Schema, model} = require ('mongoose');

const healthSchema = new Schema (
    {
        Name: {type: String, required: true},
        Image: String,
        Brand: String,
        Description: {type: String, required: true},
        Price: {type: Number, required: true},
        Rating: Number,
        Review: [{type: Schema.Types.ObjectId, ref: "reviewHealth"}]
    }
)

const health = model('health', healthSchema);

module.exports = health;