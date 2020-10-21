const {Schema, model} = require ('mongoose')

const reviewHealthSchema = new Schema (
    {
        HealthItem: [{type: Schema.Types.ObjectId, ref: "health"}],
        Name: {type: String, required: true},
        Comment: {type: String, required: true},
        Rating: {type: Number, required: true},
    }
)

const reviewHealth = model('reviewHealth', reviewHealthSchema);
module.exports = reviewHealth;