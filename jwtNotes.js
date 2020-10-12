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
Client(user): You log in to application with username and password
Server: Check if credentials are valid and look up the user. If credentials are good, server creates a JWT, signs JWT with server's private key (only the server knows about the private key), then give the client the JWT 
Client(user): Receives the JWT and keeps it local storage and attach it to all of requests
Server: Verifies the JWT signature with PUBLIC key before giving response
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