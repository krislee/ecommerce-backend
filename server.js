// DEPENDENCIES
require("dotenv").config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const mongoose = require('mongoose')
const db = require('./db/connection')
const passport = require('passport')
const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt;

const electronicRouter = require('./routes/seller/electronic')
const clothingRouter = require('./routes/seller/clothing')
const healthRouter = require('./routes/seller/health')

const electronicReviewRouter = require('./routes/buyer/electronicReview')
const clothingReviewRouter = require('./routes/buyer/clothingReview')
const healthReviewRouter = require('./routes/buyer/healthReview')
const authRoute = require('./routes/auth')

const User = require('./model/user')

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

// JWT TOKEN MIDDLEWARE
// const opts = {}
// opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
// opts.secretOrKey = 'secret';
// passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
//     User.findOne({id: jwt_payload.sub}, function(err, user) {
//         if (err) return done(err, false);
//         if (user) return done(null, user);
//         else return done(null, false);
//     });
// }));

// TEST ROUTE
app.get('/', (req,res) => {
    res.send("Your server is working")
})

app.post('/login', passport.authenticate('jwt', {session: false}),
  function(req,res){
    res.status(200).json(req.user)
  }
)

// LISTEN TO PORT
app.listen(PORT, () => {
    console.log(`Listening to ${PORT}`)
})