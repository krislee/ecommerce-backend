const {Schema, model} = require ('mongoose')

const reviewHealthSchema = new Schema (
    {
        HealthItem: [{type: Schema.Types.ObjectId, ref: "health"}],
        Name: String,
        Comment: String,
        Rating: Number
    }
)

const reviewHealth = model('reviewHealth', reviewHealthSchema);
module.exports = reviewHealth;