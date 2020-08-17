// DEPENDENCIES
require("dotenv").config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const mongoose = require('mongoose')
const db = require('./db/connection')
const app = express()
const electronicRouter = require('./routes/electronic')
const electronicReviewRouter = require('./routes/review')

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
NODE_ENV === "development" ? app.use(cors()) : app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan("dev"));
app.use(express.static("public"));

// ROUTES AND ROUTER
app.use('/store', electronicRouter)
app.use('/store', electronicReviewRouter)

// TEST ROUTE
app.get('/', (req,res) => {
    res.send("Your server is working")
})

// LISTEN TO PORT
app.listen(PORT, () => {
    console.log(`Listening to ${PORT}`)
})