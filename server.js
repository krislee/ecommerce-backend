//////// DEPENDENCIES ////////

// General Dependencies
require("dotenv").config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const app = express()
const connection = require('./db/connection')
const cookieParser = require('cookie-parser')
// Passport-related Dependencies
const passport = require('passport')
require('./auth/passport')(passport)

// Express-sessions Dependencies
const session = require('express-session')
const MongoStore = require('connect-mongo')(session) // session store
const sessionStore = new MongoStore({
  mongooseConnection: connection, // the connection to mongoDB is the database connection we have set up
  collection: 'sessions' // the database collections that we will put the sessions in will be named sessions 
})

// Item Routers Dependencies
const electronicRouter = require('./routes/seller/electronic')
const storeRouter = require('./routes/buyer/store')

// Item Review Routers Dependencies
const electronicReviewRouter = require('./routes/buyer/electronicReview')

// Login Router Dependencies
const sellerAuthRoute = require('./routes/seller/sellerAuth')
const buyerAuthRoute = require('./routes/buyer/buyerAuth')

// Profile Dependencies
const sellerProfile = require('./routes/seller/sellerProfile')
const buyerProfile = require('./routes/buyer/buyerProfile')

// Cart Dependencies
const shoppingCartRouter = require('./routes/buyer/shoppingCart');
const loginCartRouter = require('./routes/buyer/loggedInCart')
const guestCartRouter = require('./routes/buyer/guestCart')


// Stripe Dependencies
const stripeRouter = require('./routes/buyer/stripe')

//////// GLOBAL VARIABLES ////////
const PORT = process.env.PORT
const NODE_ENV = process.env.NODE_ENV
const SESSION_SECRET = process.env.SESSION_SECRET

//////// CORS ////////
// const whitelist = ["http://localhost:3000/"]; 
// const corsOptions = {
//   origin: function (origin, callback) {
//     if (whitelist.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       callback(
//         new Error("Not allowed by CORS, domain needs to be added to whitelist"), false
//       );
//     }
//   },
//   credentials: true
//   // exposedHeaders: ["set-cookie"],
// };

const corsOptions = {
  origin: 'http://localhost:3000', 
  // origin: true, 
  credentials: true,
};

// const allowlist = ['http://localhost:3000']
// const corsOptionsDelegate = function (req, callback) {
//   let corsOptions;
//   if (allowlist.indexOf(req.header('Origin')) !== -1) {
//     corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
//   } else {
//     corsOptions = { origin: false } // disable CORS for this request
//   }
//   callback(null, corsOptions) // callback expects two parameters: error and options
// }

//////// MIDDLEWARES ////////

// Put ternary to see if sites are allowed before making the server run in app.use()
// NODE_ENV === "development" ? app.use(cors()) : app.use(cors(corsOptions)); // If in development, allow all websites; if in production, allow websites in whitelist to make API calls to server
app.use(cors(corsOptions))
// app.use(cors(corsOptionsDelegate))

// Passport is an express middleware that will append diff properties to the req object, so you can store data within the req obj and each of the middlewares after will have access to the modified req object
// Need to initialize the passport object for every passport strategy on each request.
app.use(passport.initialize())

// app.use(express.json()); // Turns JSON from post/put/patch requests and converts them into req.body object
// app.use(express.urlencoded({extended: true}))
app.use(morgan("dev"));

// app.use(cookieParser('cookie_secret'))
app.use(session({
  // Creates a new secret key
  secret: process.env.SESSION_SECRET,
  // Like saveUnitialized except only when sessions get updated (ex. with different properties), false means the session will not change unless it is being changed
  resave: false,
  // When hitting route, a new document would show up (when it is true) even when there is not a property
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    maxAge: 1000*60*60*24*30, 
    // secure if true is only for https
    secure: false, 
    httpOnly:false, 
    // sameSite: 'none',
    // path: '/guest/buyer' // post only works if '/guest/buyer/post' but none of the other routes work with '/guest/buyer/post'
  }
}))

app.use(function(req, res, next) {
  // console.log("res:", res)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000" );
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Set-Cookie, Cookie");
  // console.log("res 2:", res)

  // res.set({
  //   'Access-Control-Allow-Credentials': true,
  //   'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE',
  //   "Access-Control-Allow-Origin":  "http://localhost:3000", "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-   Type, Accept, Authorization"
  // })
  // res.set('Access-Control-Expose-Headers', 'Access-Control-Allow-Credentials, Access-Control-Allow-Origin')

  
  // res.append('Access-Control-Allow-Origin', 'http://localhost:3000');
  // res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  // res.append('Access-Control-Allow-Headers', 'Content-Type');

  next();
});

app.use(express.json()); // Turns JSON from post/put/patch requests and converts them into req.body object
app.use(express.urlencoded({extended: true}))
//////// ROUTES AND ROUTER ////////

// Login/Register Route
app.use('/auth/seller', sellerAuthRoute)
app.use('/auth/buyer', buyerAuthRoute)

// Seller Account Route
app.use('/seller', [electronicRouter, sellerProfile])

// Buyer Route
app.use('/buyer', [storeRouter, electronicReviewRouter, buyerProfile, shoppingCartRouter])

// Buyer Cart Re-routing from shoppingCartRouter
app.use('/loginbuyer', loginCartRouter)
app.use('/guestbuyer', guestCartRouter)
app.use('/guest/buyer', guestCartRouter)

// Stripe Route
app.use('/create-payment-intent', stripeRouter)
app.use('/getCustomer', stripeRouter)

// LISTEN TO PORT
app.listen(PORT, () => {
    console.log(`Listening to ${PORT}`)
})

// https://stackoverflow.com/questions/44894789/node-js-express-session-creating-new-session-id-every-time-i-refresh-or-access-t

// https://medium.com/zero-equals-false/using-cors-in-express-cac7e29b005b

// https://medium.com/acmvit/handling-cookies-with-axios-872790241a9b

// https://medium.com/swlh/7-keys-to-the-mystery-of-a-missing-cookie-fdf22b012f09

