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

    
    // Listen to the events
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
            console.log("updated customer after successful payment: ", updatedCustomer)

            // Check if the payment method object that was just used to pay had to recollect CVV because user updated the payment method in payment method component. If CVV was recollected, then change it back to false. Since the updated payment method succeeded in making the payment, we no longer need to recollect the CVV.
            const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodID)
            if(paymentMethod.metadata.recollect_cvv){
                const updatedPaymentMethod = await stripe.paymentMethods.update(paymentMethodID, {
                    metadata: {recollect_cvv: false}
                })
            }
            console.log("update recollect_cvv payment method after successful payment: ", paymentMethod)

            // Fulfill order by retrieving the items from the Cart document before deleting the cart later. While retrieving the Cart items, update the Electronic item quantity.
            const order = await Order.create({
                LoggedInBuyer: data.object.customer,
                OrderNumber: uuidv4() // generate random order ID number using uuid 
            })
            const cart = await Cart.findOne({LoggedInBuyer: data.object.customer})
            for(let i=0; i < cart.Items.length; i++){

                order.Items.push(cart.Items[[i]])

                // Update inventory quantity of the items sold
                const electronic = await Electronic.findById(cart.Items[i].ItemId)
                electronic.Quantity -= cart.Items[i].Quantity

                console.log("updated quantity electronic: ", electronic)
            }
            console.log("logged in order: ", order)

            // Since there is a new cart for each order, delete cart after fulfilling order.
            const deletedCart = await Cart.findOneAndDelete({LoggedInBuyer: data.object.customer})
            console.log("logged in cart deleted: ", deletedCart)
            
        } else {
            // Fulfill order by retrieving the items from the Cart document before deleting the cart later. While retrieving the Cart items, update the Electronic item quantity.
            const order = Order.create({OrderNumber: uuidv4()})
            for(let i=0; i < req.session.cart.length; i++) {

                order.Items.push(req.session.cart[i])

                // Update inventory quantity of the items sold
                const electronic = await Electronic.findOneAndUpdate(req.session.cart[i].ItemId)
                electronic.Quantity -= cart.Items[i].Quantity

                console.log("updated quantity electronic: ", electronic)
            }
            console.log("guest order: ", order)

            // Since there is a new cart for each order, delete guest's cart after fulfilling order.
            console.log("req.session before deleting: ", req.session)
            delete req.session.cart
            console.log("delete req.session after successful payment: ", req.session)
        }

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