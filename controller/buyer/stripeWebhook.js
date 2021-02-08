require('dotenv').config()
const stripe = require("stripe")(`${process.env.STRIPE_SECRET}`)
const { v4: uuidv4 } = require('uuid');
const Cart = require('../../model/buyer/cart')
const Order = require('../../model/orders')
const {BuyerUser} = require('../../model/buyer/buyerUser')
const {Electronic} = require('../../model/seller/electronic')
const {BuyerShippingAddress} = require('../../model/buyer/shippingAddress')

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
        
        try {
            // The payment was complete
            console.log("💰 Payment succeeded with payment method " + data.object.payment_method);

            // If there is a Stripe customer ID, then it indicates user is logged in since we create a Stripe customer (just once) when creating a payment intent for logged in users.
            if(data.object.customer) {  

                // Include the last used payment method for logged in user. The last used payment method ID is stored in the data[object][payment_method] property of the event. 
                const paymentMethodID = data.object.payment_method
                const updatedCustomer = await stripe.customers.update(data.object.customer, {
                    metadata: {last_used_payment: paymentMethodID}
                })
                console.log(59, "updated customer after successful payment: ", updatedCustomer)

                // Check if the payment method object that was just used to pay had to recollect CVV because user updated the payment method in payment method component. If CVV was recollected, then change it back to false. Since the updated payment method succeeded in making the payment, we no longer need to recollect the CVV.
                const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodID)
                if(paymentMethod.metadata && paymentMethod.metadata.recollect_cvv){
                    const updatedPaymentMethod = await stripe.paymentMethods.update(paymentMethodID, {
                        metadata: {recollect_cvv: false}
                    })
                    console.log(67, "updated recollect_cvv payment method after successful payment: ", updatedPaymentMethod)

                }
                
                // Need to get the logged in user's document ID for updating last used shipping address and creating an order. To find the logged in user, use the Stripe customer's ID that was attached to logged in user's document during payment intent creation.
                const loggedInUser = await BuyerUser.findOne({customer: data.object.customer})

                // Check if there is already a last used shipping address, and remove it
                const previousLastUsedAddress = await BuyerShippingAddress.findOne({LastUsed: true, Buyer: loggedInUser._id})
                if(previousLastUsedAddress) {
                    previousLastUsedAddress.LastUsed = false
                    previousLastUsedAddress.save()
                }

                console.log(82, "previous last used address: ", previousLastUsedAddress)

                // Create new shipping address if logged in user checked Save Shipping for Future
                console.log(85, "save shipping or not?", data.object.metadata.saveShipping, typeof data.object.metadata.saveShipping)

                if(data.object.metadata.saveShipping) {
                    const savedShipping = await BuyerShippingAddress.create({
                        Name: data.object.shipping.name,
                        Address: `${data.object.shipping.line1}, ${data.object.shipping.line2}, ${data.object.shipping.city}, ${data.object.shipping.state}, ${data.object.shipping.postal_code}`,
                        Buyer: loggedInUser._id,
                        LastUsed: true
                    })
                } else {
                    // Add the lastUsed property to the address last used to checkout
                    const lastUsedAddress = await BuyerShippingAddress.findOneAndUpdate({_id: data.object.metadata.lastUsedShipping, Buyer: loggedInUser._id}, {LastUsed: true}, {new: true})
                    console.log(97, "new last used address: ", lastUsedAddress)
                }
                

                // Fulfill order by retrieving the items from the Cart document before deleting the cart later. While retrieving the Cart items, update the Electronic item quantity.
                const order = await Order.create({
                    LoggedInBuyer: loggedInUser._id,
                    OrderNumber: uuidv4() // generate random order ID number using uuid 
                })
                
                console.log(107, "create logged in order: ", order)

                const cart = await Cart.findOne({LoggedInBuyer: loggedInUser._id})
                
                console.log(111, "find cart: ", cart)

                for(let i=0; i < cart.Items.length; i++){

                    order.Items.push(cart.Items[i])
                    order.save()
                    console.log(117, cart.Items[i].ItemId)
                    console.log(118, order)
                    // Update inventory quantity of the items after items sold
                    const electronic = await Electronic.findById(cart.Items[i].ItemId)
                
                    console.log(122, "before update electronic quantity: ", electronic)

                    electronic.Quantity -= cart.Items[i].Quantity
                    electronic.save()
                    console.log("updated quantity electronic: ", electronic)
                }

                console.log(129, "added items to logged in order: ", order)

                // Since there is a new cart for each order, delete cart after fulfilling order.
                const deletedCart = await Cart.findOneAndDelete({LoggedInBuyer: loggedInUser._id})

                console.log(134, "logged in cart deleted: ", deletedCart)
            
            } else {
                // Fulfill order by retrieving the items from the Cart document before deleting the cart later. While retrieving the Cart items, update the Electronic item quantity.
                try {
                    const order = await Order.create({OrderNumber: uuidv4()})

                    console.log(141, "create order: ", order)
            
                    const session = await req.sessionStore.get(data.object.metadata.sessionID)
                    console.log(144, session)

                    console.log(146, req.session)
                    for(let i=0; i < session.cart.length; i++) {
                        console.log(148, session.cart[i].ItemId)
                        order.Items.push(session.cart[i])
                        order.save()

                        // Update inventory quantity of the items sold
                        const electronic = await Electronic.findById(session.cart[i].ItemId)
                        console.log(154, electronic)
                        electronic.Quantity -= session.cart[i].Quantity
                        console.log(156, electronic.Quantity)
                        electronic.save()
                        console.log(158, "updated quantity in electronic: ", electronic)
                    } 
                    // Since there is a new cart for each order, delete guest's session after fulfilling order.
                    await req.sessionStore.destroy(data.object.metadata.sessionID, async function() {
                        const deletedSession = await req.sessionStore.get(data.object.metadata.sessionID)
                        console.log(deletedSession)
                    })
                    
                    console.log(166, "added items in guest order: ", order)
                } catch(error) {
                    console.log(168)
                    console.log(error)
                }
                
                
            }

            //////////////////////////////////
            // Delete the saved idempotency associated with the payment intent in CachePaymentIntent for the guest(?) since the payment intent is successful???
            // console.log(134, "before clearing cookies: ", req.cookies)
            // if(req.cookies){
            //     res.clearCookie('idempotency')
            // }
            // console.log(138, "after clearing cookies: ", req.cookies)
        } catch(error) {
            console.log(183, error)
            // res.status(400).json({message: error})
        }
    } 
    // Customer’s payment was declined by card network or otherwise expired
    else if (eventType === "payment_intent.payment_failed") { 

        // The payment failed to go through due to decline or authentication request 
        const error = data.object.last_payment_error.message;
        console.log(192, "❌ Payment failed with error: " + error);

        console.log(194, "status: ", data.object.status)

        // Prompt user to provide another payment method and attaching it to the already made payment intent by sending back to the payment intent's client secret
        // res.send({
        //     error: data.object.last_payment_error,
        //     clientSecret: data.object.client_secret,
        //     publicKey: process.env.STRIPE_PUBLIC
        // });

    } else if (eventType === "payment_method.attached") {

        // A new payment method was attached to a customer 
        console.log(206, "💳 Attached " + data.object.id + " to customer");
    }

    res.sendStatus(200);
}

module.exports = {webhook}


// payment intent process webhook (happens when payment methods have delayed notification.): pending order and then if the payment intent status turns to succeed or requires payment method (the event is payment_intent.payment_failed), then do certain actions

// add the statement_descriptor to payment intent with Date.now()

