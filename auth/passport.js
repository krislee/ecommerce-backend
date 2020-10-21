const User = require('../model/seller/sellerUser')

const fs = require('fs')
const path = require('path')
const JWTStrategy = require('passport-jwt').Strategy
// Since the server needs to know where and how the JWT is stored in the request (usually in the Authorization HTTP header), use the ExtractJwt class from passport-jwt module. It contains diff methods to find the JWT and parse the JWT from the request. Since we will store the JWT in the Auth HTTP header, we will use the fromAuthHeaderAsBearerToken() method from ExtractJwt class.  
const ExtractJWT = require('passport-jwt').ExtractJwt

const pathToKey = path.join(__dirname, '.', 'id_rsa_pub.pem')
const PUB_KEY = fs.readFileSync(pathToKey, 'utf8')

const options = {
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: PUB_KEY,
    algorithms: ['RS256']
}


// When making the passport jwt strategy (new JWTStrategy), the passport jwt strategy has already verified the JWT token by going through the options. So as indicated in the options it will grab the JWT token from the Auth HTTP header and grab the public key. The token and public key are passed into the verify function found in jsonwebtoken library. After verifying, the payload obj is passed into verify callback and the verify callback is called.
const strategy = new JWTStrategy(options, async (payload, done) => { 
    try {
        const user = await User.findById(payload.sub)
        // Once user is found, attach it to the passport obj
        if(await user){
            return done(null, user)
        } else {
            return done(null, false) // if there were no errors from verifying JWT (i.e. correct signature and data not tampered) but no user is found from the payload
        }
    } catch (err) {
        done(err, null)
    }
})

module.exports = (passport) => {
    passport.use(strategy)
}