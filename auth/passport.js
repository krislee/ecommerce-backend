const {SellerUser} = require('../model/seller/sellerUser')
const {BuyerUser} = require('../model/buyer/buyerUser')
const fs = require('fs')
const path = require('path')
const JWTStrategy = require('passport-jwt').Strategy
// Since the server needs to know where and how the JWT is stored in the request (usually in the Authorization HTTP header), use the ExtractJwt class from passport-jwt module. It contains diff methods to find the JWT and parse the JWT from the request. Since we will store the JWT in the Auth HTTP header, we will use the fromAuthHeaderAsBearerToken() method from ExtractJwt class.  
const ExtractJWT = require('passport-jwt').ExtractJwt

const pathToKey = path.join(__dirname, '.', 'id_rsa_pub.pem')
const PUB_KEY = fs.readFileSync(pathToKey, 'utf8')

const options = {
    // jwtFromRequest: ExtractJWT.fromAuthHeaderWithScheme('Bearer'),
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: PUB_KEY,
    algorithms: ['RS256']
}


// When making the passport jwt strategy (new JWTStrategy), the passport jwt strategy has already verified the JWT token by going through the options. So as indicated in the options it will grab the JWT token from the Auth HTTP header and grab the public key. The token and public key are passed into the verify function found in jsonwebtoken library. After verifying, the payload obj is passed into verify callback and the verify callback is called.
const strategy = new JWTStrategy(options, async (payload, done) => { 
    try {
        console.log(21, "TOKEN in strategy", payload.sub)
        const seller = await SellerUser.findById(payload.sub)
        // console.log(seller, 'seller from passport')
        if(await seller) return done(null, seller)

        const buyer = await BuyerUser.findById(payload.sub)
        // console.log(buyer, 'buyer from passport')
        if(await buyer) return done(null, buyer)
        
        console.log('random password')

        return done(27, 38) // if there were no errors from verifying JWT (i.e. correct signature and data not tampered) but no user is found from the payload
    } catch (err) {
        console.log('ERROR FROM PASSPORT STRATEGY\n----------------')
        console.log(36, err)
        done(err, false)
    }
})

module.exports = (passport) => {
    passport.use(strategy)
}