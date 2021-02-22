const {Schema, model} = require('mongoose')

const socketSchema = new Schema({
   cartID: String,
   socketID: String
})

const SocketID = model('socketID', socketSchema)
module.exports = SocketID