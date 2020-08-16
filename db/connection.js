require("dotenv").config()
const mongoose = require('mongoose')

const mongoURI = process.env.mongoURI + "ecommerce"
const db = mongoose.connection
const mongoConfigObject = { useNewUrlParser: true, useUnifiedTopology: true };

// CONNECT TO DATABASE
mongoose.connect(mongoURI, mongoConfigObject, () => {
    console.log("CONNECTED TO MONGO"); 
  });
  
db.on("error", (err) => console.log(err.message + " is Mongod not running?"));
db.on("connected", () => console.log("mongo connected!"));
db.on("disconnected", () => console.log("mongo disconnected"));