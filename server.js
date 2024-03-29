/* ------- DEPENDENCIES ------- */

// General Dependencies
require("dotenv").config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const app = express()
const connection = require('./db/connection')
const SocketID = require('./model/socket')

// LISTEN TO PORT
const server = app.listen(process.env.PORT, () => {
  console.log(`Listening to ${process.env.PORT}`)
})
// SET UP WEBSOCKET
const io = require('socket.io')(server, 
//   {
//   cors: {
//       origin: "*",
//       methods: ["GET", "POST"]
//   }
// }
)

io.on('connection', (socket) => {
  console.log(20, "CLIENT CONNECTED")

  socket.on('cartID', async(cartID) => {
    console.log(22, "CARTID", cartID)
    console.log(23, "SOCKETID", socket.id)
    const socketID = await SocketID.create({socketID: socket.id, cartID: cartID.cartID})
    console.log(26, socketID)
  })

  socket.on('end', async(cartID) => {
    console.log(30, "AFTER COMPLETE ORDER CART ID", cartID)
    const deletedSockets = await SocketID.deleteMany({cartID: cartID.cartID})
    console.log(32, "DELETED SOCKETS", deletedSockets)
  })

  socket.on('disconnect', () => console.log(35, "DISCONNECTING"))

  // Disconnect the socket and delete the socket info in db since we have done the job of sending the info immediately after confirming payment
  // socket.on('end', async (socket) => {
  //   await SocketID.deleteMany({socketID: socket.id})
  //   // socket.disconnect(0)
  //   console.log(32, "AFTER DELETING SOCKET")
  // })

})


// app.set('socketio', io)
// app.locals.io = io
// io.on('connection', (socket) => {
//   console.log(22, 'Client connected');
//   console.log(23, socket.id)

//   socket.emit('socketID', socket.id)
//   socket.on('close', () => console.log("Client disconnected"))
//   // , async (data) => {
//   //   console.log(26, data)
//   //   const completeOrder = await Order.findOne({OrderNumber: data.cartID})
//   //   socket.emit('completeOrder', {order: completeOrder})
//   // })

//   // socket.on('completeOrder', async (data) => {
//   //    const completeOrder = await Order.findOne({OrderNumber: data.cartID})
//   //   io.sockets.emit('completeOrder', {order: completeOrder})
//   // })
// })

//   // console.log(37, receivedData)
//   // console.log(38, completeOrder)
//   // io.to(receivedData.socketID).emit('recievedOrder', {order: completeOrder})
//   // socket.on('end', (socket) => socket.disconnect(0))
//   socket.on('disconnect', () => socket.removeAllListeners())
// })



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
const sellerProfileRouter = require('./routes/seller/sellerProfile')
const buyerProfileRouter = require('./routes/buyer/buyerProfile')

// Cart Dependencies
const shoppingCartRouter = require('./routes/buyer/shoppingCart');
const loginCartRouter = require('./routes/buyer/loggedInCart')
const guestCartRouter = require('./routes/buyer/guestCart')


// Stripe Dependencies
const stripeRouter = require('./routes/buyer/stripe')
const {webhook} = require('./controller/buyer/stripeWebhook')

// Shipping Address Dependency
const shippingAddressRouter = require('./routes/buyer/shippingAddress')

// Order Dependency
const orderRouter = require('./routes/buyer/order')
// const Order = require("./model/order")


/* ------- CORS ------- */
const corsOptions = {
  // origin: 'http://localhost:3000', 
  // origin: process.env.CLIENT_URL,
  origin: "https://elecommerce.netlify.app",
  credentials: true,
};

/* ------- MIDDLEWARES ------- */

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
  }
}))

app.use(function(req, res, next) {
  // console.log("res:", res)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
  // res.setHeader("Access-Control-Allow-Origin", process.env.CLIENT_URL);
  res.setHeader("Access-Control-Allow-Origin", "https://elecommerce.netlify.app");
  // res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
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

// Store the websocket object, io, on the request object by creating any key name, i.e. io; io is stored on so req.io object
app.use(function(req, res, next) {
  req.io = io;
  // req.socketIDContainer = {}
  next();
});

/* ------- ROUTES AND ROUTER ------- */

// Login/Register Route
app.use('/auth/seller', sellerAuthRoute)
app.use('/auth/buyer', buyerAuthRoute)

// Seller Account Route
app.use('/seller', [electronicRouter, sellerProfileRouter])

// Buyer Route
app.use('/buyer', [storeRouter, electronicReviewRouter, buyerProfileRouter, shoppingCartRouter])

// Buyer Cart Re-routing from shoppingCartRouter
app.use('/loginbuyer', loginCartRouter)
app.use('/guestbuyer', guestCartRouter)
app.use('/guest/buyer', guestCartRouter)

// Stripe Route
app.use('/order', stripeRouter)
app.use('/webhook', webhook)

// Stripe Re-route for creating payment intent for LOGGED IN users 
app.use('/logged-in', stripeRouter)

// Shipping Address Route
app.use('/shipping', shippingAddressRouter)

// Order Route
app.use('/complete', orderRouter)




// LISTEN TO PORT
// app.listen(process.env.PORT, () => {
//   console.log(`Listening to ${process.env.PORT}`)
// })

// https://stackoverflow.com/questions/44894789/node-js-express-session-creating-new-session-id-every-time-i-refresh-or-access-t

// https://medium.com/zero-equals-false/using-cors-in-express-cac7e29b005b

// https://medium.com/acmvit/handling-cookies-with-axios-872790241a9b

// https://medium.com/swlh/7-keys-to-the-mystery-of-a-missing-cookie-fdf22b012f09



