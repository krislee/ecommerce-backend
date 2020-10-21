const jsonwebtoken = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const pathToKey = path.join(__dirname, '.', 'id_rsa_priv.pem')
const PRIV_KEY = fs.readFileSync(pathToKey, 'utf8')

function issueJWT(user){
    ////// CREATE PAYLOAD TO BE PART OF THE TOKEN //////
    const payload = {
        sub: user._id, // user ID
        iat: Date.now(), // JWT issued at date
    }


    ////// EXPIRATION OF TOKEN //////

    // Token will expire in 60days
    const expiresIn = '60d'


    ////// CREATE TOKEN //////

    // Using the algo, hash the data that contains the header and payload & then sign that data with the private key (header is auto created by the jsonwebtoken library). By doing the hashing and signing of the data, the token now has the header + payload + hashed and signed data.
    const signedToken = jsonwebtoken.sign(payload, PRIV_KEY, {expiresIn: expiresIn, algorithm: 'RS256'})
    console.log(signedToken, "signedToken")
    return {
        token: "Bearer " + signedToken,
        expires: expiresIn
    }
}

module.exports = {issueJWT}