const express = require('express')
const app = express()

// initially written the home route as:
app.get('/', (req, res, next) => { // passing in a route string and callback function
    res.send('<h1>Hello World</h1>')
}) // go to localhost:3000 and see Hello World

// but we can write the callback for routes outside:
function standardExpressCallback(req, res, next) { // express will pass in the 3 parameters to callbacks: req, res, next
// if you call next parameter as a function, it will call the next middleware in the chain
    console.log("I am the standard express function")
    res.send('<h1>Hello World</h1>')
}

// rewrite the home route to:
app.get('/', standardExpressCallback) 

app.listen(3000)

//////////////////////////////////////////////////////////////////////////////////////////////
const express = require('express')
const app = express()

function middleware1 (req, res, next) {
    // can put any code in middleware, i.e.:
    console.log("I am a middleware")
}

function standardExpressCallback(req, res, next) {
    console.log("I am the standard express function")
    res.send('<h1>Hello World</h1>')
}

// let's rewrite the home route to include middleware1 function with middleware1 function as a ROUTE-SPECIFIC MIDDLEWARE: 
app.get('/', middleware1, standardExpressCallback) // the / route will run middleware1 but then keep loading forever because we never called next parameter as a function in middleware 1, so middleware1 has ran console logging "I am a middleware" but when the server continues to send a response for / route, trying to run the following function, standardExpressCallback, that function doesn't run because no next() in middleware1 function, so let's revise middleware 1 function:

function middleware1 (req, res, next) {
    // can put any code in middleware, i.e.:
    console.log("I am a middleware")
    next()
}
app.get('/', middleware1, standardExpressCallback) // will now console logs " I am a middleware", then "I am the standard express function"

app.listen(3000)

//////////////////////////////////////////////////////////////////////////////////////////////

const express = require('express')
const app = express()

// Let's rewrite middleware1 function to be a LOCAL MIDDLEWARE, which is a middleware that will run whenever any routes are hit:
app.use(middleware1) // app.use() expects a parameter that is a middleware function
// will first initialize the express app, then initialize the middleware1 function

app.get('/', standardExpressCallback) 

function middleware1 (req, res, next) {
    // can put any code in middleware, i.e.:
    console.log("I am a middleware")
}

function standardExpressCallback(req, res, next) {
    console.log("I am the standard express function")
    res.send('<h1>Hello World</h1>')
}

// When we run the application before hitting any route, you would expect the console log "I am a middleware" from app.use(middleware1) since the middleware is not in a route but nothing happens. This is because when we add app.use(), we are only adding a piece to a chain of functions, or middlewares, that we call when ANY routes are hit. So only when you hit a route, then the local middlewares run follow by route-specific middlewares and route callbacks

app.listen(3000)

//////////////////////////////////////////////////////////////////////////////////////////////

const express = require('express')
const app = express()

app.use(middleware1)
app.use(middleware2) // if middleware2 did not have a next(), then when we hit the / route it would never be able to run standardExpressCallback, it will just run middleware1 then middleware2
// if we switch the middlewares: first app.use(middleware2) then app.use(middleware1), then it will run middleware2 then middleware1 => order of middlewares matter when executing middlewares

// local middlewares
function middleware1(req, res, next) {
    console.log("I am middleware 1")
    next()
}

function middleware2(req, res, next) {
    console.log(" I am middleware 2")
    next()
}

// route callback, which can technically be called as a middleware too
function standardExpressCallback(req, res, next) { 
    console.log("I am the standard express function")
    res.send('<h1>Hello World</h1>')
}

// route with no route-specific middleware
app.get('/', standardExpressCallback)

app.listen(3000)

//////////////////////////////////////////////////////////////////////////////////////////////

const express = require('express')
const app = express()

app.use(middleware2) 
app.use(middleware1)

// local middlewares
function middleware1(req, res, next) {
    console.log("I am middleware 1")
    next()
}

function middleware2(req, res, next) {
    console.log(" I am middleware 2")
    next()
}

function middleware3(req, res, next) {
    console.log(" I am middleware 3")
    next()
}

// route callback
function standardExpressCallback(req, res, next) { 
    console.log("I am the standard express function")
    res.send('<h1>Hello World</h1>')
}

// route with no route-specific middleware
app.get('/', middleware3, standardExpressCallback)

app.listen(3000)

// When we hit the routes, we would see "I am a middleware 2", then "I am a middleware 1", then  "I am a middleware 3", then "I am the standard express function".

//////////////////////////////////////////////////////////////////////////////////////////////

const express = require('express')
const app = express()

app.use(middleware)

// local middlewares, including error handlers
function middleware(req, res, next) {
    console.log("I am middleware")
    next()
}

function errorHandler1(err, req, res, next) { // error handler is another middleware but a special type of middleware; it has a 4th parameter, err, which gets populated if an error does exist
    if(err.status === 1) {
        // do something
    } 
}

// You can define as many error handlers are you want to handle different types of errors:
function errorHandler2(err, req, res, next) {
    if(err.status === 2) {
        // do something
    } 
}

// route callback
function standardExpressCallback(req, res, next) { 
    console.log("I am the standard express function")
    res.send('<h1>Hello World</h1>')
}

// route with no route-specific middleware
app.get('/', standardExpressCallback)

app.listen(3000)

//////////////////////////////////////////////////////////////////////////////////////////////

const express = require('express')
const app = express()

app.use(middleware2) 
app.use(middleware1)

// local middlewares
function middleware1(req, res, next) {
    console.log("I am middleware 1")
    next()
}

function middleware2(req, res, next) {
    console.log(" I am middleware 2")
    next()
}

function middleware3(req, res, next) {
    console.log(" I am middleware 3")
    next()
}

// route callback
function standardExpressCallback(req, res, next) { 
    console.log("I am the standard express function")
    res.send('<h1>Hello World</h1>')
}

// route with no route-specific middleware
app.get('/', middleware3, standardExpressCallback)

app.listen(3000)

// When we hit the routes, we would see "I am a middleware 2", then "I am a middleware 1", then  "I am a middleware 3", then "I am the standard express function".

//////////////////////////////////////////////////////////////////////////////////////////////

const express = require('express')
const app = express()

app.use(middleware)

// local middlewares, including error handlers
function middleware(req, res, next) {
    console.log("I am middleware")

    // Let's say there are no error handlers (commented out errorHandler function) and we have an error arising from a middleware 
    const errObj = new Error("I am an error")

    // normally we will just call next, next(), and call the next middleware but in this case we will pass the error object - it is common to pass the error object when we are trying to catch any errors that can happen with the database when making a call to the database in the middleware
    next(errObj)
}


// function errorHandler(err, req, res, next) {
//     if(err) {
//         res.send('<h1> There was an error, please try again</h1>')
//     }
// }

// route callback
function standardExpressCallback(req, res, next) { 
    console.log("I am the standard express function")
    res.send('<h1>Hello World</h1>')
}

// route with no route-specific middleware
app.get('/', standardExpressCallback)

app.listen(3000)

// When we hit the route without an error handler, it will show on the browser page, Error: I am an error and the error stack tray & the error crashes the server. Let's fix this by putting the error handler:

app.use(middleware)
app.use(errorHandler)

// local middlewares, including error handlers
function middleware(req, res, next) {
    console.log("I am middleware")

    const errObj = new Error("I am an error")
    
    next(errObj)
}


function errorHandler(err, req, res, next) {
    if(err) {
        res.send('<h1> There was an error, please try again</h1>') // will see this on the browser page when you hit the / route, and you would not see Hello World
    }
}


// route callback
function standardExpressCallback(req, res, next) { 
    console.log("I am the standard express function")
    res.send('<h1>Hello World</h1>')
}

// route with no route-specific middleware
app.get('/', standardExpressCallback)

app.listen(3000)

// But remember that the order of middlewares matters. If we switched the app.use(), then you will see on the browser page the same thing: Error: I am an error and the error stack tray & the error crashes the server
app.use(errorHandler)
app.use(middleware)

function middleware(req, res, next) {
    console.log("I am middleware")

    const errObj = new Error("I am an error")
    
    next(errObj)
}

function errorHandler(err, req, res, next) {
    if(err) {
        res.send('<h1> There was an error, please try again</h1>') // will not see this on the browser page when you hit the / route, the error will crash the server and the browser page shows Error: I am an error and the error stack tray
    }
}


// route callback
function standardExpressCallback(req, res, next) { 
    console.log("I am the standard express function")
    res.send('<h1>Hello World</h1>')
}

// route with no route-specific middleware
app.get('/', standardExpressCallback)

app.listen(3000)

// So in this case, the solution is to put the error handler after all the routes and middlewares. This is because if there are any errors in any of the middlewares or routes callback, then the error will be passed directly to the final error handler, skipping any middlewares or routes that might be after the middleware or route callback that raised an error:

app.use(middleware) // when / route is hit, middleware function runs, but because there is an error in the middleware function, it will skip the route callback and go directly to app.use(errorHandler), so you will see "There was an error, please try again" on the browser page.

function middleware(req, res, next) {
    console.log("I am middleware")

    const errObj = new Error("I am an error")
    
    next(errObj)
}

function errorHandler(err, req, res, next) {
    if(err) {
        res.send('<h1> There was an error, please try again</h1>')
    }
}


// route callback
function standardExpressCallback(req, res, next) { 
    console.log("I am the standard express function")
    res.send('<h1>Hello World</h1>')
}

// route with no route-specific middleware
app.get('/', standardExpressCallback)

app.use(errorHandler)

app.listen(3000)

//////////////////////////////////////////////////////////////////////////////////////////////

app.use(middleware1) // When the / route hits, this runs first
app.use(middleware2) // then this runs next

// local middlewares
function middleware1(req, res, next) {

    // We can append different properties, objects, and functions to the params we are passing in the middlewares:
    req.customProperty = 100 // created a variable attached to the request obj

    next()
}

function middleware2(req, res, next) {

    // Since express passes request and response objects through each middleware, they are available in later middlewares:
    console.log(`The custom property's value is ${req.customProperty}`)

    // reassign customProperty, which will mean that when route callback runs next after the local middlewares are run, customProperty's value will reflect the reassigned value and not as 100:
    req.customProperty = 600

    next()
}

function errorHandler(err, req, res, next) {
    if(err) {
        res.send('<h1> There was an error, please try again</h1>')
    }
}

// route callback
function standardExpressCallback(req, res, next) { 
    res.send(`<h1> The value is: ${req.customProperty}</h1>`) // show in the browser: The value is 600
}

// route with no route-specific middleware
app.get('/', standardExpressCallback) // then this runs last

app.use(errorHandler)

app.listen(3000)




// Side notes: PassportJS is an express middleware. The passport middleware will take the request obj and append different properties to it.