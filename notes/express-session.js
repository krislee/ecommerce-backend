const express = require('express')
const mongoose = require('mongoose')

// sessions are used to store information about a client moving throughout the browser
// session and cookie are different by where they store the data: cookie stores its data in the browser, and the browser will attach the cookie's key-value pair to every HTTP request the browser makes vs. sessions stores its data on the server, so the express server can store larger amount of data unlike a cookie
// session and cookie are different in terms of what data they can each store: a cookie cannot store sensitive info i.e. user's credentials vs. we can store those data in the server - if we are storing user's login credientials, we can authenticate into the session with a secret key
const session = require('express-session')

// after making sessions, you then need a persistent storage/memory to store the sessions in especially when you may be storing a lot of information about the client as the client is moving throughout the browser => the best storage is a database to store the sessions, or information
// by default, express-session middleware has its own implementation of a session store which is using memory local to your application and not the database - so we need a session store, which connects the espress-session to the database
// you have a lot of options for session store, in this case we are using connect-mongo, allowing you to connect to mongoDB to store the sessions in the mongodb that you already have running in your app when we connect to the database (in line 17 is where we connect to the database)
// then you need to tell express-session middleware that you want to use mongoDB as the storage, which will be in store options in express-session middleware
const MongoStore = require('connect-mongo')(session) // used for session store

// create the express application
const app = express()

// connect to the database
const dbString = 'mongodb://localhost:27017/tutorial_db' // using local tutorial_db database (make sure the mongoDB database is running before running express server)
const dbOptions = {useNewURLParser: true, useUnifiedTopology: true}
const connection = mongoose.createConnection(dbString, dbOptions)

// middleware
app.use(express.json()) // allows server to parse json requests 
app.use(express.urlencoded({extended:true}))

// after having the allowance to make a connection to mongoDB by making MongoStore, make the connection to mongoDB for the express-session middleware by making a new session store and then tell express-session to use that session store to store sessions
const sessionStore = new MongoStore({
    mongooseConnection: connection, // the connection to mongoDB is the database connection we previously set up
    collection: 'sessions' // the database collections that we will put the sessions in will be named sessions 
})

// app.use(session()) is telling the server to use the express-session middleware
// we can pass inside session() an object of all the options, including store option that is needed to actually use mongoDB as the database storage for sessions
app.use(session({
    secret: 'some secret', // the secret key is usually stored as an environmental variable; if the secret key is invalid, then the session is invalid too 
    
    // resaved and saveUnitialized options are to tell what the session does if nothing is changed or if something is changed
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
    cookie: {maxAge: 1000*60*60*24} // setting the cookie to equal 1 day in seconds (1 day * 24hr/1 day * 60min/1 hr * 60sec/1 min)
}))

app.get('/', (req, res, next) => {
    res.send('<h1>Hello World (Sessions)</h1>')
})

app.listen(3000)


// When you run the server you can see the collection called sessions is initialized in the mongo database. There will not be anything inside sessions database collection until you hit / route.
// When you then hit / route, the express-session middleware is run in app.use(session({options: optionValues, ...})), creating a session, which will have an ID. The session ID will be stored in the cookie in the browser. By default in express-session middleware, the cookie name is connect.sid and the value of the cookie is the session ID). Then, the cookie is then placed in the set-cookie in the HTTP response header. The browser will receive the cookie and set the cookie, which means everytime the website is refreshed the cookie is attached to the request header. So on every request, the expression-session middleware will receive the cookie and take the value of the cookie and look up the session ID in the session store, which is the database, and see if the session ID is valid. If the session ID is valid, then it will use the information from the session to either authenticate user, find out some data about the user, etc. 
   // You will not see the cookie in response header until you refresh the page but you will see the set-cookie in request header when you hit the / route the first time
// in the sessions database collection, you will find one document of the session established in the browser
// Everytime the server gets the specific cookie with the session ID atttached to the cookie, it will come to the sessions database collection and grab the document, or session, out of the database, or session store and get information that we have set onto the session, and use the information for the application.

// Passport will connect to express-sessions middleware and uses the session to authenticate the user

// We can also go to the route and get information about the session:
app.get('/', (req, res, next) => {
    console.log(req.session) // get information about the session --> you will see the session set to the cookie object

    // we can also set properties to the session to get other information:
    if (req.session.viewCount) { // if we have viewCount property in the session object, then we increment it by 1
        req.session.viewCount = req.session.viewCount + 1
    } else { // need the else statement because the first occurrence we do not have viewCount property set, so we will set viewCount property to the session and by setting a new property to the session, it will persist in the session store, or mongo database
        req.session.viewCount = 1;
    }

    res.send(`<h1>You have visted this page ${req.session.viewCount} times </h1>`)
})