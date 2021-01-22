const router = require('express').Router();
const passport = require('passport');
const passportAuthenticate = passport.authenticate('jwt', {session: false})

const {createPaymentIntent, getCustomerDetails} = require('../../controller/buyer/stripe')

router.post('/', createPaymentIntent)


// Each endpoint listens to some events that you designate the event to listen to (designate in the Stripe Dashboard). Since Stripe optionally signs the event that is sent to the endpoint, where the signature value is stored in the Stripe-Signature header, you can check if Stripe was the one that sent the event and not some third party. Webook event signing happens by using the Stripe's library and providing the library the endpoint secret, event payload, and Stripe-Signature header.  
router.post("/webhook", async (req, res) => {
    // First, check if webhook signing is configured.
    let data, eventType;
    if (process.env.STRIPE_WEBHOOK_SECRET) {
        // Retrieve the event by verifying the signature using the raw body and secret.
        let event;
        let signature = req.headers["stripe-signature"];
        try {
            event = stripe.webhooks.constructEvent(
                req.rawBody,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            );

            console.log("event: ", event)

            data = event.data;
            eventType = event.type;

        } catch (err) {
            console.log(`⚠️  Webhook signature verification failed.`);
            return res.sendStatus(400);
        }
        
    } else {
        // If there is no webhook signing, then we can retrieve the event data directly from the request body.
        data = req.body.data;
        eventType = req.body.type;
    }

    
    // Listen to the events
    if (eventType === "payment_intent.succeeded") {
        // The payment was complete
        console.log("💰 Payment succeeded with payment method " + data.object.payment_method);

        // If there is an Authorization header, then user is logged in. So include the last used payment method for logged in user. The last used payment method ID is stored in the data[object][payment_method] property of the event.
        if(req.headers.authorization) {
            const loggedInUser = await LoggedInUser.findById(req.user._id)
            const customer = await stripe.customers.update(loggedInUser.customer, {
                metadata: {last_used_payment: data.object[payment_method]}
            })
        }
        
        // Fulfill any orders and store order ID, e-mail receipts, delete cart, update quantity of items

    } else if (eventType === "payment_intent.payment_failed") {
        // The payment failed to go through due to decline or authentication request 
        const error = data.object.last_payment_error.message;
        console.log("❌ Payment failed with error: " + error);
    } else if (eventType === "payment_method.attached") {
        // A new payment method was attached to a customer 
        console.log("💳 Attached " + data.object.id + " to customer");
    }
    res.sendStatus(200);
});
  

  


module.exports = router