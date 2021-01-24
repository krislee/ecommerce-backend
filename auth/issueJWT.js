require("dotenv").config()
const jsonwebtoken = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Path to Private Key File
// const pathToKey = path.join(__dirname, '.', 'id_rsa_priv.pem')
// Get the private key in Private Key File
// const PRIV_KEY = fs.readFileSync(pathToKey, 'utf8')

function issueJWT(user){
    ////// CREATE PAYLOAD TO BE PART OF THE TOKEN //////
    console.log(13)
    const payload = {
        sub: user._id, // user ID
        iat: Date.now(), // JWT issued at date
    }
    console.log(18, "payload: ", payload)

    ////// EXPIRATION OF TOKEN //////

    // Token will expire in 60days
    const expiresIn = '60d'
    
    console.log(25, JSON.parse(process.env.SESSION_SECRET))
    console.log(24, process.env.SESSION_SECRET)
    // console.log(26, JSON.parse(process.env.SESSION_SECRET).replace(/\\n/g, '\n'))

    
    // console.log(25, "JSON.parse(process.env.PRIV_KEY): ", JSON.parse(process.env.PRIV_KEY))
    ////// CREATE TOKEN //////

    // Using the algo, hash the data that contains the header and payload & then sign that data with the private key (header is auto created by the jsonwebtoken library). By doing the hashing and signing of the data, the token now has the signature (signature = hashed header + hashed payload + private key) of the JWT. 
    const signedToken = jsonwebtoken.sign(payload, JSON.parse(process.env.PRIV_KEY), {expiresIn: expiresIn, algorithm: 'RS256'})
    
    return {
        token: "Bearer " + signedToken,
        expires: expiresIn
    }
}

module.exports = {issueJWT}