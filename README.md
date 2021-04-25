## Deployed Website 
Click [here](https://elecommerce.netlify.app/) to view our online electronics store, Elecommerce! 
## Run Locally

1. Install all dependencies

```js
npm i 
```
2. Elecommerce application applies asymmetric cryptography for customer's authentication. Asymmetric cryptography involves a private key and public key. Generate a private and public key. 
```
cd auth
node generateKeyPair.js
```
3. Set up environmental variables in ```.env``` file. Create ```.env``` file at the root.
```js
PORT=3001 // You can change the port number to some other number aside from port 3000; port 3000 is used for React client-side
mongoURI='mongodb://localhost:27017/<some_database_name>' // substitute some_database_name with the name of the Mongo database you choose
SESSION_SECRET=create_some_session_secret_key // create any secret key for the session store
STRIPE_SECRET=some_Stripe_secret_key // find Stripe's API secret key in your Stripe's dashboard (requires you to have a Stripe account)
STRIPE_WEBHOOK_SECRET=some_Stripe_webhook_secret_key // find Stripe's webhook secret key in your Stripe's dashboard
```
4. For both user profile's payment methods and checkout functionalities, the client-side code is required. Set up the client-side locally.
    
    1. Clone the [client-side repository](https://github.com/krislee/ecommerce-frontend).
    2. Follow steps [here](https://github.com/krislee/ecommerce-frontend/blob/main/README.md#run-locally) to set up client-side code locally.
    3. Open the client's .env file and add the following:
        ```REACT_APP_server_URL='https://localhost:3000'```
5. Open ```server.js```
    1. Change the value of ```corsOptions.origin``` from ```https://elecommerce.netlify.app"``` to ```http://localhost:3000```:

    <b>Before</b>
     ```js
    const corsOptions = {
        origin: "https://elecommerce.netlify.app",
        credentials: true,
    };
     ```
    <b>After</b>
    ```js
    const corsOptions = {
        origin: "http://localhost:3000",
        credentials: true,
    };
    ```
    2. Change ```Access-Control-Allow-Origin``` from ```https://elecommerce.netlify.app``` to ```http://localhost:3000```

    <b>Before</b>
    ```js
    app.use(function(req, res, next) {
        res.setHeader('Access-Control-Allow-Credentials', true);
        res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
        res.setHeader("Access-Control-Allow-Origin", "https://elecommerce.netlify.app");
        res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Set-Cookie, Cookie, X-Forwarded-Proto");
        next();
    });
    ```
    <b>After</b>
    ```js
    app.use(function(req, res, next) {
        res.setHeader('Access-Control-Allow-Credentials', true);
        res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
        res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
        res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Set-Cookie, Cookie, X-Forwarded-Proto");
        next();
    });
    ```

5. Run ```npm start``` or ```nodemon start```.

## Database
Mongo Database is used to store sessions, electronic items' details, socket IDs, payment intent IDs, and logged in user's profile, shipping addresses, cart, and reviews. To validate the schemas against the Mongo Database's collections, Mongoose library is used.
## Libraries
- Passport
    - ```passport``` library used for authentication middleware
- Passport-JWT
    - Use JSON Web Token for authentication
- Socket.io
    - Establishes a communication with the client to receive the ID of the cart from the client and send complete order information to the client
- express-session 
    - Used to store guest cart's object
- Stripe
    - Payment Intents and Payment Methods are created, displayed, updated, and deleted by making calls to the Stripe server. 
- CORS
- Mongoose
## Issues
Currently, you can experience the full user functionalities of the deployed website on desktop.

Please bear with us as we work on resolving the following issues for the website on mobile/tablet:
- Guests cannot make orders on Google Chrome app 
- CSS and UI are skewed
## Client-side Code Source
Click [here](https://github.com/krislee/ecommerce-frontend) to view the client-side code repository.