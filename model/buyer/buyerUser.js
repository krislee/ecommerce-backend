const {Schema, model} = require('mongoose')

const buyerUserSchema = new Schema({
    username: {
        type: String,
        required: true,
        min: 8,
        max: 255
    },
    email: {
        type: String,
        required: true,
        min: 8,
        max: 255
    },
    password: {
        type: String,
        required: true,
        max: 1024,
        min: 8
    },
    date: {
        type: Date,
        default: Date.now()
    },
    buyer: {
        type: Boolean,
        required: true
    }
})



buyerUserSchema.pre('deleteOne', { document: true, query: true}, async function(next) {
    try {
        console.log(this, "this")
        // Delete all electronic review documents that referenced to the removed buyer
        this.model('ElectronicReview').deleteMany({Buyer: this._id})
        next()
    }
    catch (error) {
        next(error)
    }
})

module.exports = model('BuyerUser', buyerUserSchema)