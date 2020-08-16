const {Schema, model} = require ('mongoose');

const storeSchema = new Schema (
    {
        Electronic: [{type: Schema.Types.ObjectId, ref: "electronic"}],
        Health: [{type: Schema.Types.ObjectId, ref: "health"}],
        Clothing: [{type: Schema.Types.ObjectId, ref: "clothing"}],
    }
)

const store = model('store', storeSchema);
module.exports = store