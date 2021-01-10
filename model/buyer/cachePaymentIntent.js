const {Schema, model} = require('mongoose')

const cachePaymentIntentSchema = new Schema ({
    Customer: String,
    Idempotency: String,
    PaymentIntentId: String
})

const cachePaymentIntent = model('cachePaymentIntent', cachePaymentIntentSchema)

module.exports = cachePaymentIntent