/* 

JWT:
1) Header
    a) When transporting JSON web tokens, the receiver of the JSON web token would not know anything about the JSON web token. So the issuer/sender of the JSON web token will identify which algo to create the digital signature
        - uses RS256 algo means we will be using asymmetric crypto for the digital signature along with the SHA 256 hashing function
    b) the type of JSON web token
2) Payload: metadata - in most cases metadata about the user - would not contain any credentials in the payload (can make your own claims or use the standard claims)
    a) sub (subject): usually contains the id of the user object that you can look up
    b) iat (issued at date): when the JWT is issued
    c) iss (issuer): identify the issuer of the JWT. Do not need it if the same application issues and verifies the JWT. But in other cases, there is a certificate authority that acts as the 3rd party authroity that is trusted to issue JWT tokens (the certificate authority only issues) => have an established central authority that everyone trusts that signs the JWT with its private key. Because the central authority signed with its private key, it will give out the public key and anyone can trust this insitution and use the public key to verify the token so that if it matches the JWT token was issued by a trusted authority
    d) aud (audience): the receivers of the JWT token which are listed as URL that identifies which server the JWT is valid for. So if Google is is the issuer of the JWT, the aud maybe www.google.com and if you try to use the JWT outside of google.com then it will be rejected
3) Signature
    a) Asymmetric crytography 
    b) Symmetric cryptography

Encoded base-64 URL --> decoded into JSON objects   

There is no 3rd party certificate authorities, the server will issue and verify JWT tokens:
Client(user's browser): You log in to application with username and password
Server: Check if credentials are valid and look up the user. If credentials are good, server creates a JWT, signs JWT with server's private key (only the server knows about the private key), then give the client the JWT 
Client: Receives the JWT and keeps it local storage or a cookie and attach it to all of requests
Server: Verifies the JWT signature with PUBLIC key. If signature is valid (meaning JWT has not been tampered and is coming from the user we expect), server decodes the JWT from base64URL to JSON format, usually gets the database ID of the user in the payload.sub, so server looks the user up in the db from payload.sub, and stores the user object in the reqest object and then use it in routes
*/

// Issue JWT 
const base64url = require('base64url')
const crypto = require('crypto')
const signatureFunction = crypto.createSign('RSA-SHA256') // get the algo from crypto to sign the JWT
const fs = require('fs') // need the file system to access the private and public keys saved

const headerObj = {
    alg: 'RS256',
    typ: 'JWT'
}

const payloadObj = {
    sub: '1234567890',
    name: 'John Doe',
    admin: true,
    iat: 1516239022
}

const headerObjString = JSON.stringify(headerObj) // convert JS objects into JSON
const payloadObjString = JSON.stringify((payloadObj))

const base64URLHeader = base64(headerObjString) // converts JSON into base 64 URL format
const base64URLPayload = base64(payloadObjString)

// sign and issue JWT (1) take the hash of base64URLHeader and base64URLPayload and 2) sign the hash)

// 1) Make a hash
signatureFunction.write(base64URLHeader + '.' + base64URLPayload) // pass data in to hash - hash using SHA256 hashing function
signatureFunction.end()

//2) Sign the hash
const PRIV_KEY = fs.readFileSync(__dirname + '/priv_key.pem', 'utf8') // load the private key from another file
const signatureBase64 = signatureFunction.sign(PRIV_KEY, 'base64') // sign the data which gives a base64 encoded signature

const signatureBase64URL = base64url.fromBase64(signatureBase64) // to actually derive the JWT, we need to convert base64 to base64 URL so now the signature will be in base64 URL

// Verify JWT 
// npm i base64url
const verifyFunction = crypto.createVerify('RSA-SHA256')
const jwtParts = JWT.split('.')
const headerInBase64URLFormat = jwtParts[0]
const payloadInBase64URLFormat = jwtParts[1]
const signatureInBase64URLFormat = jwtParts[2]

verifyFunction.write(headerInBase64URLFormat + '.' + payloadInBase64URLFormat)
verifyFunction.end()

const jwtSignatureBase64 = base64url.toBase64(signatureInBase64URLFormat) // crypto library only accepts base64 encoding so we need to take base64 url signature and convert it to base64


// const decodedHeader = base64url.decode(headerInBase64URLFormat)
// const decodedPayload = base64url.decode(payloadInBase64URLFormat)
// const decodedSignature = base64url.decode(signatureInBase64URLFormat) // have not decrypted the signature



// Verify JWT or decrypt signature with Public Key which corresponds to the issuer's private key used to sign the JWT
const PUB_KEY = fs.readFileSync(__dirname + '/pub_key.pem', 'utf8')
const signatureIsValid = verifyfunction.verify(PUB_KEY, jwtSignatureBase64, 'base64')

// Easier way to issue and verify JWT 
const jwt = require('jsonwebtoken')
const fs = require('fs')
const PUB_KEY = fs.readFileSync(__dirname + '/pub_key.pem', 'utf8')
const PRIV_KEY = fs.readFileSync(__dirname + '/priv_key.pem', 'utf8')

const payloadObj = {
sub: '1234567890',
name: 'John Doe',
admin: true,
iat: 1516239022
}

const signedJWT = jwt.sign(payloadObj, PRIV_KEY, {algorithm: 'RS256'}) // header is created by the jsonwebtoken library based on the algo; payloadObj does not have to be in JSON format - just JS obj; pass private key to sign JWT with; combine the payload and header and sign it 

jwt.verify(signedJWT, PUB_KEY, {algorithms:['RS256']}, (err, payload)=> {
console.log(err)
})// if there is an err it could be wrong public key or tampered JWT 


/* Passport Strategy

Any passport strategies needs a verify callback

passport.authenticate() will call the verify callback defined in the passport config function (in passport.js module.exports)

Passport middleware expects the same 3 responses:
1) if the verified callback returns some error, whether it is a db error or express app error, pass in the done callback with err and false params
2) if successfully authenticated, error is null and have a user object which will be attached to the request obj
3) if there is no error but an invalid user then it is false for user
 */

// Using passport to verify JWT
const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt; // ExtractJwt comes with diff methods to to find the JWT and parsing it
const fs = require('fs');
const path = require('path');
const router = require('./routes/auth')
const User = require('mongoose').model('User');

const pathToKey = path.join(__dirname, '..', 'id_rsa_pub.pem');
const PUB_KEY = fs.readFileSync(pathToKey, 'utf8');

// At a minimum, you must pass the `jwtFromRequest` and `secretOrKey` properties
const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: PUB_KEY, // either pass in a symmetric key (aka secret stored in environment variable or public key - since we're using RS256 algo we will use the Public key) 
  algorithms: ['RS256']
};

// JwtStrategy takes in 2 params: options and verify callback function which will have payload and done callback
const strategy = new JwtStrategy(options, (payload, done) => { // By the time we are here, the JwtStrategy has taken the options and JWT token from the header, used the jsonwebtoken library to verify the JWT token, and then once verified JwtStrategy passes the payload object 
    //  In the verified callback for passport, you do not have a specific way that you are required to verify in authentication. So you make up the code logic. Since we are using mongoDB, we will use the findOne method.
    User.findOne({_id: payload.sub})
    .then(user => {
        // Since we have already verified the JWT token we just need to find the user in the db and pass the user to passport to attach to the req object
        if(user) return done(null, user) // returns user object to passport; passport then attaches to the req.user object in the express framework
        else return done(null, false)
    })
    .catch(err => done(err, null))
})

module.exports = (passport) => { // passport param will be replaced by passport arg which is  passed from app.js
    passport.use(strategy) // similar to a middleware, we will take the passport obj argument passed to do .use()
}
// app.js will pass the global passport object here, and this function will configure it
module.exports = (passport) => {
    // The JWT payload is passed into the verify callback
    passport.use(new JwtStrategy(options, function(jwt_payload, done) {

        console.log(jwt_payload);
        
        // We will assign the `sub` property on the JWT to the database ID of user
        User.findOne({_id: jwt_payload.sub}, function(err, user) {
            
            // This flow look familiar?  It is the same as when we implemented
            // the `passport-local` strategy
            if (err) {
                return done(err, false);
            }
            if (user) {
                return done(null, user);
            } else {
                return done(null, false);
            }
            
        });
        
    }));
}

// When passport JWT strategy tries to verify JWT token in the authorization header with the public key that corresponds to the private key, it will reject the JWT token if the JWT token was not issued by signing with the private key. So we need to write a code in login route to issue a new JWT token sign with private key. Then the passport JWT middleware will use the public key that reside in the server and successfully verify the newly issued JWT token.

// lib/utils.js
const crypto = require('crypto');
const jsonwebtoken = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const pathToKey = path.join(__dirname, '..', 'id_rsa_priv.pem');
const PRIV_KEY = fs.readFileSync(pathToKey, 'utf8');

/**
 * -------------- HELPER FUNCTIONS ----------------
 */

/**
 * 
 * @param {*} password - The plain text password
 * @param {*} hash - The hash stored in the database
 * @param {*} salt - The salt stored in the database
 * 
 * This function uses the crypto library to decrypt the hash using the salt and then compares
 * the decrypted hash/salt with the password that the user provided at login
 */
function validPassword(password, hash, salt) {
    var hashVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === hashVerify;
}

/**
 * 
 * @param {*} password - The password string that the user inputs to the password field in the register form
 * 
 * This function takes a plain text password and creates a salt and hash out of it.  Instead of storing the plaintext
 * password in the database, the salt and hash are stored for security
 * 
 * ALTERNATIVE: It would also be acceptable to just use a hashing algorithm to make a hash of the plain text password.
 * You would then store the hashed password in the database and then re-hash it to verify later (similar to what we do here)
 */
function genPassword(password) {
    var salt = crypto.randomBytes(32).toString('hex');
    var genHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    
    return {
      salt: salt,
      hash: genHash
    };
}


/**
 * @param {*} user - The user object.  We need this to set the JWT `sub` payload property to the MongoDB user ID
 */
function issueJWT(user) { // takes the user obj in the database
  const _id = user._id;

  const expiresIn = '1d'; // JWT token expires in 1 day

  const payload = {
    sub: _id,
    iat: Date.now()
  };

//  sign token
  const signedToken = jsonwebtoken.sign(payload, PRIV_KEY, { expiresIn: expiresIn, algorithm: 'RS256' });

  return {
    token: "Bearer " + signedToken,
    expires: expiresIn
  }
}

module.exports.validPassword = validPassword;
module.exports.genPassword = genPassword;
module.exports.issueJWT = issueJWT;


// routes/users.js

// Verify JWT
router.get('/protected', passport.authenticate('jwt', { session: false }), (req, res, next) => {
    res.status(200).json({ success: true, msg: "You are successfully authenticated to this route!"});
}); // {session: false} - not using passport session middleware to interact with the express middleware; passport jwt middleware takes the token and run through the verification callback using jsonwebtoken library
// call the passport.authenticate() everytime so that the passport middleware can grab the JWT everytime and verify it

// Validate an existing user and issue a JWT
router.post('/login', function(req, res, next){
    User.findOne({ username: req.body.username })
        .then((user) => { // find the user and put into the user object
            if (!user) { // if there is no user in the db
                res.status(401).json({ success: false, msg: "could not find user" });
            }
            
            // Function defined at bottom of app.js
            const isValid = utils.validPassword(req.body.password, user.hash, user.salt); // check if the password is valid by taking the node crypto library in the validPassword function
            
            if (isValid) { // if valid user give a JWT token

                const tokenObject = utils.issueJWT(user);

                res.status(200).json({ success: true, user: user, token: tokenObject.token, expiresIn: tokenObject.expires });

            } else {
                res.status(401).json({ success: false, msg: "you entered the wrong password" });
            }

        })
        .catch((err) => {
            next(err); // catch the errors and put the error via the express middleware error handler function
        });
});

// Register a new user
router.post('/register', function(req, res, next){
    
    const saltHash = utils.genPassword(req.body.password); 
    
    // Creating a salt and hash for the plain-text password 
    const salt = saltHash.salt;
    const hash = saltHash.hash;

    const newUser = new User({
        username: req.body.username,
        hash: hash,
        salt: salt
    });

    try {
        newUser.save()
            .then((user) => { // pass the newUser object argument into user param
                const jwt = utils.issueJWT(user)
                res.json({ success: true, user: user, token: jwt.token, expiresIn: jwt.expiresIn }); // attach to the success message: user, token, expiresin
            });

    } catch (err) {
        res.json({ success: false, msg: err });
    }
});

