// DEPENDENCIES
require("dotenv").config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const mongoose = require('mongoose')
const db = require('./db/connection')

const electronicRouter = require('./routes/seller/electronic')
const clothingRouter = require('./routes/seller/clothing')
const healthRouter = require('./routes/seller/health')

const electronicReviewRouter = require('./routes/buyer/electronicReview')
const clothingReviewRouter = require('./routes/buyer/clothingReview')
const healthReviewRouter = require('./routes/buyer/healthReview')
const authRoute = require('./routes/auth')

const app = express()


//GLOBAL VARIABLES
const PORT = process.env.PORT
const NODE_ENV = process.env.NODE_ENV

// CORS
const whitelist = ["http://localhost:3000/"]; 
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(
        new Error("Not allowed by CORS, domain needs to be added to whitelist")
      );
    }
  },
};

// MIDDLEWARE
// Put ternary to see if sites are allowed before making the server run in app.use()
NODE_ENV === "development" ? app.use(cors()) : app.use(cors(corsOptions)); // If in development, allow all websites; if in production, allow websites in whitelist to make API calls to server
app.use(express.json()); // Turns JSON from post/put/patch requests and converts them into req.body object
app.use(morgan("dev"));
app.use(express.static("public"));


// ROUTES AND ROUTER
app.use('/api', authRoute)
app.use('/store', [electronicRouter, clothingRouter, healthRouter, electronicReviewRouter, clothingReviewRouter, healthReviewRouter])


// TEST ROUTE
app.get('/', (req,res) => {
    res.send("Your server is working")
})

// LISTEN TO PORT
app.listen(PORT, () => {
    console.log(`Listening to ${PORT}`)
})