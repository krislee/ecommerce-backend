require('dotenv').config()
const stripe = require("stripe")(`${process.env.STRIPE_SECRET}`)

// Each endpoint (the proj's endpoint is /webhook/events) listens to some events that you designate the event to listen to (designate in the Stripe Dashboard). Since Stripe optionally signs the event that is sent to the endpoint, where the signature value is stored in the Stripe-Signature header, you can check if Stripe was the one that sent the event and not some third party. Webook event signing happens by using the Stripe's library and providing the library the endpoint secret, event payload, and Stripe-Signature header.  

const webhook = async (req, res) => {
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

        // If there is an Authorization header, then user is logged in. 
        if(req.headers.authorization) {
            if (req.user.buyer) {
                const loggedInUser = await LoggedInUser.findById(req.user._id)

                // Include the last used payment method for logged in user. The last used payment method ID is stored in the data[object][payment_method] property of the event. 
                const paymentMethodID = data.object.payment_method
                const customer = await stripe.customers.update(loggedInUser.customer, {
                    metadata: {last_used_payment: paymentMethodID}
                })

                // Check if the payment method object that was just used to pay had to recollect CVV because user updated the payment method in payment method component. If CVV was recollected, then change it back to false since the updated payment method succeeded in making the payment.
                const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodID)
                if(paymentMethod.metadata.recollect_cvv){
                    const updatedPaymentMethod = await stripe.paymentMethods.update(paymentMethodID, {
                        metadata: {recollect_cvv: false}
                    })
                }

            console.log("last used address for checkout: ", lastUsedAddress)
            }
        }

        // Fulfill any orders and store order ID, e-mail receipts, delete cart, update quantity of items



        //////////////////////////////////
        // Delete the saved idempotency associated with the payment intent in CachePaymentIntent for the guest(?) since the payment intent is successful???
        console.log("before clearing cookies: ", req.cookies)
        if(req.cookies){
            res.clearCookie('idempotency')
        }
        console.log("after clearing cookies: ", req.cookies)

        

    } else if (eventType === "payment_intent.payment_failed") {

        // The payment failed to go through due to decline or authentication request 
        const error = data.object.last_payment_error.message;
        console.log("❌ Payment failed with error: " + error);

    } else if (eventType === "payment_method.attached") {

        // A new payment method was attached to a customer 
        console.log("💳 Attached " + data.object.id + " to customer");
    }

    res.sendStatus(200);
}



module.exports = {webhook}