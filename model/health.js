const {Schema, model} = require ('mongoose');

const healthSchema = new Schema (
    {
        Name: String,
        Image: String,
        Brand: String,
        Description: String,
        Price: Number,
        Rating: Number,
        Review: [{type: Schema.Types.ObjectId, ref: "reviewHealth"}]
    }
)

const health = model('health', healthSchema);

module.exports = health;