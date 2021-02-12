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
    oldPasswords: {
        type: [String], 
        required: true
    },
    date: {
        type: Date,
        default: Date.now()
    },
    buyer: {
        type: Boolean,
        required: true
    },
    customer: { // Stripe customer object id
        type: String
    },
    name: {
        type: String,
        required: true,
        min: 8,
        max: 255
    }
})



buyerUserSchema.pre('deleteOne', { document: true, query: true}, async function(next) {
    try {

        // Delete all electronic review documents that referenced to the removed buyer
        await this.model('reviewElectronic').deleteMany({Buyer: this._id})

        // Delete all address documents that referenced to the removed buyer
        await this.model('BuyerShippingAddress').deleteMany({Buyer: this._id})

        // Delete cart document (if there is one) that referenced to the removed buyer
        await this.model('cart').deleteOne({LoggedInBuyer: this._id})

        // Continue running the deleteOne function in the delete buyer profile route
        next()
    }
    catch (error) {
        next(error)
    }
})

const BuyerUser = model('BuyerUser', buyerUserSchema)

module.exports = {BuyerUser}