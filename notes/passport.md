You need a verified callback in passport JWT authentication strategy. The verified callback will be called when passport.authenticate() method in the routes are run. (For ecommerce app, the verified callback are defined in configs/passport where the passport jwt stratefy is). Every route you want to protect, use passport.authenticate('jwt', {session: false}) with the routes. Session is false because we are not using the passport session middleware to interact with express middleware - we are using JWT. 

```javascript
new JWTStrategy(options, verify)
```

The following is copied from the passport JWT strategy doc to exemplify the verify callback.

```javascript
passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
    User.findOne({id: jwt_payload.sub}, function(err, user) {
        // If the verified callback returns an error, whether it is a db error or express server error, we pass the error to the done callback & false for the user param to the done callback
        if (err) {
            return done(err, false);
        }
        // If the verified callback does not return an error, meaning user is successfully authenticated, then we pass null for the error and the user obj to the done callback. The user obj will be attached to the request obj.
        if (user) {
            return done(null, user);
        } 
        // If the verified callback does not return an error but there is an invalid user, then we pass null for the error and false for the user obj
        else {
            return done(null, false);
            // or you could create a new account
        }
    });
}));
```

You can also pass options in passport JWT authentication strategy. Most of the options are very similar to jsonwebtoken npm library. If you wanted to include ALL the options put it in a separate options obj (```passportJWTOptions```) and then pass it in the verify function.
```javascript
const passportJWTOptions = {
    // These are options only to the passport library. Do not put these options in jsonWebTokenOptions
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: PUB_KEY || secretPhrase,
    issuer: 'enter issuer here',
    audience: 'enter audience here',
    algorithms: ['RS256'],
    ignoreExpiration: false,
    passReqToCallback: false,
    // These passport options are pulled from the jsonwebtoken library
    jsonWebTokenOptions: {
        complete: false,
        clockTolerance: '',
        maxAge: '2d', // 2 days
        clockTimestamp: '100',
        nonce: 'string here for OpenID'
    }
}
```

The passport JWT auth strategy uses the jsonwebtoken library to verify the JWT. Specifically, it uses the following from jsonwebtoken library:
```javascript
jwt.verify(token, secretOrPublicKey, [options, callback])
```
The passport JWT auth strategy will pass the token it receives, the public key in our case, options from the passport. 




