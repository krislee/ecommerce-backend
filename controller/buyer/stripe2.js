require("dotenv").config()
const stripe = require("stripe")(`${process.env.STRIPE_SECRET}`)
const LoggedInCart = require('../../model/buyer/cart')
const LoggedInUser = require('../../model/buyer/buyerUser')
const CachePaymentIntent = require('../../model/buyer/cachePaymentIntent')

const indexPaymentMethods = async(req, res) => {
    const loggedInUser = await LoggedInUser.findById(req.user._id)
  
    const paymentMethods = await stripe.paymentMethods.list({
      customer: loggedInUser.customer, // customer's id stored in found BuyerUser's document
      type: 'card',
    });
  
    
}

// Load the default or last used payment method
const checkoutPaymentMethod = async(req, res) => {
    try {
        // Get the user's info, which contains customer's ID
        const loggedInUser = await LoggedInUser.findById(req.user._id)
        // Get the Stripe customer
        const customer = await stripe.customers.retrieve(loggedInUser.customer)
        // Get the default payment method stored in Stripe customer. The value is null if no default is stored.
        const defaultPaymentMethod = await customer.invoice_settings.default_payment_method

        // Get the last used payment method by getting the last payment intent made
        const paymentIntents = await stripe.paymentIntents.list()

        console.log("list of all payment intents created")

        paymentIntents.data[data.length-1]


    } catch(error){
        console.log("error", error)
        res.status(400).json({msg: "Error"})
    }
}

// Client's default payment method box clicked and checked will run defaultPaymentMethod()
const defaultPaymentMethod = async(req, res) => {
    try {
        // Get the user's info, which contains customer's ID
        const loggedInUser = await LoggedInUser.findById(req.user._id)
        
        // Update the Stripe customer object to include the default payment method
        const updatedCustomer = await stripe.customers.update(loggedInUser.customer, {
            invoice_settings: {
                default_payment_method: req.query.pm
            }
        });

        console.log("updated customer: ", updatedCustomer)

        res.status(200).json({success: true})
    } catch(error){
        console.log(" default Payment method error", error)
        res.status(400).json({msg: "Error"})
    }
}


// Each endpoint listens to some events that you designate the event to listen to (designate in the Stripe Dashboard). Since Stripe signs the event that is sent to the endpoint, where the signature value is stored in the Stripe-Signature header, you can check if Stripe was the one that sent the event and not some third party. To check verify the signature by using Stripe's library, you need the endpoint secret, event payload, and Stripe-Signature header.  
app.post("/webhook", async (req, res) => {
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
        // Webhook signing is recommended, but if it is not we can retrieve the event data directly from the request body.
        data = req.body.data;
        eventType = req.body.type;
    }


    if (eventType === "payment_intent.succeeded") {
      // The payment was complete
      // Fulfill any orders, e-mail receipts, etc
      console.log("💰 Payment succeeded with payment method " + data.object.payment_method);
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
  
  app.listen(4242, () => console.log(`Node server listening on port ${4242}!`));
  