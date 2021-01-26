require('dotenv').config()
const stripe = require("stripe")(`${process.env.STRIPE_SECRET}`)
const { v4: uuidv4 } = require('uuid');
const Cart = require('../../model/buyer/cart')
const Order = require('../../model/orders')
const Electronic = require('../../model/seller/electronic')

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

    
    // Listen to the events:

    // Customer’s payment succeeded
    if (eventType === "payment_intent.succeeded") {
        
        // The payment was complete
        console.log("💰 Payment succeeded with payment method " + data.object.payment_method);

        // If there is a Stripe customer ID, then it indicates user is logged in since we create a Stripe customer (just once) when creating a payment intent for logged in users.
        if(data.object.customer) {  

            // Include the last used payment method for logged in user. The last used payment method ID is stored in the data[object][payment_method] property of the event. 
            const paymentMethodID = data.object.payment_method
            const updatedCustomer = await stripe.customers.update(data.object.customer, {
                metadata: {last_used_payment: paymentMethodID}
            })
            console.log(57, "updated customer after successful payment: ", updatedCustomer)

            // Check if the payment method object that was just used to pay had to recollect CVV because user updated the payment method in payment method component. If CVV was recollected, then change it back to false. Since the updated payment method succeeded in making the payment, we no longer need to recollect the CVV.
            const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodID)
            if(paymentMethod.metadata.recollect_cvv){
                const updatedPaymentMethod = await stripe.paymentMethods.update(paymentMethodID, {
                    metadata: {recollect_cvv: false}
                })
                console.log(65, "updated recollect_cvv payment method after successful payment: ", updatedPaymentMethod)

            }
    
            // Fulfill order by retrieving the items from the Cart document before deleting the cart later. While retrieving the Cart items, update the Electronic item quantity.
            const order = await Order.create({
                LoggedInBuyer: data.object.customer,
                OrderNumber: uuidv4() // generate random order ID number using uuid 
            })
            
            console.log(75, "create logged in order: ", order)

            const cart = await Cart.findOne({LoggedInBuyer: data.object.customer})
            
            console.log(79, "find cart: ", cart)

            for(let i=0; i < cart.Items.length; i++){

                order.Items.push(cart.Items[[i]])

                // Update inventory quantity of the items sold
                const electronic = await Electronic.findById(cart.Items[i].ItemId)
                electronic.Quantity -= cart.Items[i].Quantity

                console.log("updated quantity electronic: ", electronic)
            }

            console.log(92, "added items to logged in order: ", order)

            // Since there is a new cart for each order, delete cart after fulfilling order.
            const deletedCart = await Cart.findOneAndDelete({LoggedInBuyer: data.object.customer})

            console.log(97, "logged in cart deleted: ", deletedCart)
            
        } else {
            // Fulfill order by retrieving the items from the Cart document before deleting the cart later. While retrieving the Cart items, update the Electronic item quantity.
            const order = Order.create({OrderNumber: uuidv4()})

            console.log(103, "create order: ", order)

            for(let i=0; i < req.session.cart.length; i++) {

                order.Items.push(req.session.cart[i])

                // Update inventory quantity of the items sold
                const electronic = await Electronic.findOneAndUpdate(req.session.cart[i].ItemId)
                electronic.Quantity -= cart.Items[i].Quantity

                console.log(113, "updated quantity in electronic: ", electronic)
            }
            console.log(115, "added items in guest order: ", order)

            // Since there is a new cart for each order, delete guest's cart after fulfilling order.
            console.log(118, "req.session before deleting: ", req.session)
            delete req.session.cart
            console.log(120, "delete req.session after successful payment: ", req.session)
        }

        //////////////////////////////////
        // Delete the saved idempotency associated with the payment intent in CachePaymentIntent for the guest(?) since the payment intent is successful???
        console.log(125, "before clearing cookies: ", req.cookies)
        if(req.cookies){
            res.clearCookie('idempotency')
        }
        console.log(129, "after clearing cookies: ", req.cookies)

    } 
    // Customer’s payment was declined by card network or otherwise expired
    else if (eventType === "payment_intent.payment_failed") { 

        // The payment failed to go through due to decline or authentication request 
        const error = data.object.last_payment_error.message;
        console.log(137, "❌ Payment failed with error: " + error);

        console.log(139, "status: ", data.object.status)

        // Prompt user to provide another payment method and attaching it to the already made payment intent by sending back to the payment intent's client secret
        res.send({
            error: data.object.last_payment_error,
            clientSecret: data.object.client_secret,
            publicKey: process.env.STRIPE_PUBLIC
        });

    } else if (eventType === "payment_method.attached") {

        // A new payment method was attached to a customer 
        console.log(151, "💳 Attached " + data.object.id + " to customer");
    }

    res.sendStatus(200);
}

module.exports = {webhook}


// payment intent process webhook (happens when payment methods have delayed notification.): pending order and then if the payment intent status turns to succeed or requires payment method (the event is payment_intent.payment_failed), then do certain actions

// add the statement_descriptor to payment intent with Date.now()

