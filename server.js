// DEPENDENCIES

// General Dependencies
require("dotenv").config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const app = express()
require('./db/connection')

// Passport-related Dependencies
const passport = require('passport')
require('./auth/passport')(passport)


// Item Routers Dependencies
const electronicRouter = require('./routes/seller/electronic')
const clothingRouter = require('./routes/seller/clothing')
const healthRouter = require('./routes/seller/health')
const storeRouter = require('./routes/buyer/store')

// Item Review Routers Dependencies
const electronicReviewRouter = require('./routes/buyer/electronicReview')
const clothingReviewRouter = require('./routes/buyer/clothingReview')
const healthReviewRouter = require('./routes/buyer/healthReview')

// Login Router Dependencies
const sellerAuthRoute = require('./routes/seller/sellerAuth')
const buyerAuthRoute = require('./routes/buyer/buyerAuth')


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


// Put ternary to see if sites are allowed before making the server run in app.use()
NODE_ENV === "development" ? app.use(cors()) : app.use(cors(corsOptions)); // If in development, allow all websites; if in production, allow websites in whitelist to make API calls to server
app.use(express.json()); // Turns JSON from post/put/patch requests and converts them into req.body object
app.use(morgan("dev"));
app.use(express.static("public"));


// ROUTES AND ROUTER

// Login/Register Route
app.use('/auth/seller', sellerAuthRoute) 
app.use('/auth/buyer', buyerAuthRoute)

// Seller Account Route
app.use('/seller', [electronicRouter, clothingRouter, healthRouter])

// Buyer Route
app.use('/buyer', [storeRouter, electronicReviewRouter, clothingReviewRouter, healthReviewRouter])


// Passport is an express middleware that will append diff properties to the req object, so you can store data within the req obj and each of the middlewares after will have access to the modified req object

// Need to initialize the passport object for every passport strategy on each request.
app.use(passport.initialize())


// TEST ROUTE
app.get('/', (req,res) => {
    res.send("Your server is working")
})


// LISTEN TO PORT
app.listen(PORT, () => {
    console.log(`Listening to ${PORT}`)
})