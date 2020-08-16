const {Schema, model} = require ('mongoose');

const storeSchema = new Schema (
    {
        Electronics: [{type: Schema.Types.ObjectId, refer: "electronics"}],
        Health: [{type: Schema.Types.ObjectId, refer: "health"}],
        Clothing: [{type: Schema.Types.ObjectId, refer: "clothing"}],
    }
)

const store = model('store', storeSchema);
module.exports = store