const {Schema, model} = require('mongoose')

const orderSchema = new Schema({
    Items: [{
        ItemId: String,
        Name: String,
        Image: String,
        Brand: String,
        Quantity: Number,
        TotalPrice: Number
    }],
    Shipping: {
        Name: String,
        Address: String
    },
    PaymentMethod: String,
    TotalPrice: Number,
    CartID: String, // client sends either the sessionID (if guest) or cart document _id (if logged in user) to look up the order
    OrderNumber: String,
    LoggedInBuyer: [{type: Schema.Types.ObjectId, ref: "BuyerUser"}]
})

const Order = model('order', orderSchema)
module.exports = Order