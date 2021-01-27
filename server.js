//////// DEPENDENCIES ////////

// General Dependencies
require("dotenv").config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const app = express()
const connection = require('./db/connection')

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
const {webhook} = require('./controller/buyer/stripeWebhook')

//////// CORS ////////
const corsOptions = {
  origin: 'http://localhost:3000', 
  // origin: true, 
  // origin: 'https://elecommerce.netlify.app',
  credentials: true,
};

//////// MIDDLEWARES ////////

app.use(cors(corsOptions))

// Passport is an express middleware that will append diff properties to the req object, so you can store data within the req obj and each of the middlewares after will have access to the modified req object
// Need to initialize the passport object for every passport strategy on each request.
app.use(passport.initialize())

// app.use(express.json()); // Turns JSON from post/put/patch requests and converts them into req.body object
// app.use(express.urlencoded({extended: true}))
app.use(morgan("dev"));

app.set("trust proxy", 1)
app.use(session({
  // Creates a new secret key
  secret: process.env.SESSION_SECRET,
  // Like saveUnitialized except only when sessions get updated (ex. with different properties), false means the session will not change unless it is being changed
  resave: false,
  // When hitting route, a new document would show up (when it is true) even when there is not a property
  saveUninitialized: false,
  store: sessionStore,
  // proxy: true,
  cookie: {
    maxAge: 1000*60*60*24*30, 
    // secure if true is only for https
    secure: true, 
    httpOnly:false,
    sameSite: 'none'
    // sameSite: false
    // path: '/guest/buyer' // post only works if '/guest/buyer/post' but none of the other routes work with '/guest/buyer/post'
  }
}))

app.use(function(req, res, next) {
  // console.log("res:", res)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
  // res.setHeader("Access-Control-Allow-Origin", "https://elecommerce.netlify.app");
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Set-Cookie, Cookie, X-Forwarded-Proto");
  // console.log("res 2:", res)
  next();
});

// app.use(express.json()); // Turns JSON from post/put/patch requests and converts them into req.body object
app.use(
  express.json({
    // We need the raw body to verify webhook signatures.
    // Make the raw body only when hitting the Stripe webhook endpoint.
      verify: function(req, res, buf) {
          if (req.originalUrl.startsWith("/webhook")) {
              req.rawBody = buf.toString();
          }
      }
  })
);
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
app.use('/order', stripeRouter)
app.use('/webhook', webhook)

// Stripe Re-route for logged in users creating payment intent
app.use('/logged-in', stripeRouter)

// LISTEN TO PORT
app.listen(process.env.PORT, () => {
    console.log(`Listening to ${process.env.PORT}`)
})

// https://stackoverflow.com/questions/44894789/node-js-express-session-creating-new-session-id-every-time-i-refresh-or-access-t

// https://medium.com/zero-equals-false/using-cors-in-express-cac7e29b005b

// https://medium.com/acmvit/handling-cookies-with-axios-872790241a9b

// https://medium.com/swlh/7-keys-to-the-mystery-of-a-missing-cookie-fdf22b012f09

