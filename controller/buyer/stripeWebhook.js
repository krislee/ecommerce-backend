require('dotenv').config()
const stripe = require("stripe")(`${process.env.STRIPE_SECRET}`)
// const { v4: uuidv4 } = require('uuid');
const Cart = require('../../model/buyer/cart')
const Order = require('../../model/order')
const {BuyerUser} = require('../../model/buyer/buyerUser')
const {Electronic} = require('../../model/seller/electronic')
const {BuyerShippingAddress} = require('../../model/buyer/shippingAddress');
const {CachePaymentIntent} = require('../../model/buyer/cachePaymentIntent')
const EventEmitter = require('events');
const SocketID = require('../../model/socket')
// const { ws } = require('../../routes/buyer/store')
// const ee = new EventEmitter();

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

            // console.log("event: ", event)

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
            console.log("💰💰💰 Payment succeeded with payment method " + data.object.payment_method);

            // If there is a Stripe customer ID, then it indicates user is logged in since we create a Stripe customer (just once) when creating a payment intent for logged in users.
            if(data.object.customer) {  

                // Include the last used payment method for logged in user. The last used payment method ID is stored in the data[object][payment_method] property of the event. 
                const paymentMethodID = data.object.payment_method
                const updatedCustomer = await stripe.customers.update(data.object.customer, {
                    metadata: {last_used_payment: paymentMethodID}
                })
                console.log(64, "updated customer after successful payment: ", updatedCustomer)

                // Check if the payment method object that was just used to pay had to recollect CVV because user updated the payment method in payment method component. If CVV was recollected, then change it back to false. Since the updated payment method succeeded in making the payment, we no longer need to recollect the CVV.
                const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodID)
                if(paymentMethod.metadata && paymentMethod.metadata.recollect_cvv){
                    const updatedPaymentMethod = await stripe.paymentMethods.update(paymentMethodID, {
                        metadata: {recollect_cvv: false}
                    })
                    console.log(72, "updated recollect_cvv payment method after successful payment: ", updatedPaymentMethod)

                }
                
                // Need to get the logged in user's document ID for updating last used shipping address and creating an order. To find the logged in user, use the Stripe customer's ID that was attached to logged in user's document during payment intent creation.
                const loggedInUser = await BuyerUser.findOne({customer: data.object.customer})

                console.log(79, typeof data.object.metadata.lastUsedShipping, data.object.metadata.lastUsedShipping )

                // Check if there is already a last used shipping address that is different from the one that just used, and remove it
                const previousLastUsedAddress = await BuyerShippingAddress.findOne({LastUsed: true, Buyer: loggedInUser._id})
                console.log(83, previousLastUsedAddress) // null if logged in user has no last used address or any saved addresses
                if(previousLastUsedAddress) {
                    console.log(85, previousLastUsedAddress._id, typeof previousLastUsedAddress._id)
                }
               
                if(previousLastUsedAddress && (String(previousLastUsedAddress._id) !== data.object.metadata.lastUsedShipping)) {
                        previousLastUsedAddress.LastUsed = false
                        previousLastUsedAddress.save()
                        console.log(91, "make false to previous address: ", previousLastUsedAddress)
                }

                // Create new shipping address if logged in user checked Save Shipping for Future
                console.log(95, "save shipping or not?", data.object.metadata.saveShipping, typeof data.object.metadata.saveShipping)
                // console.log(88, "shipping in web hook", data.object.shipping)
               
                const shippingAddress = data.object.shipping.address
                if(data.object.metadata.saveShipping === "true") {
                    // const shippingAddress = data.object.shipping.address
                    const savedShipping = await BuyerShippingAddress.create({
                        Name: data.object.shipping.name,
                        Address: `${shippingAddress.line1}, ${shippingAddress.line2}, ${shippingAddress.city}, ${shippingAddress.state}, ${shippingAddress.postal_code}`,
                        Buyer: loggedInUser._id,
                        LastUsed: true
                    })
                } else {
                    
                    // Add the lastUsed property to the address last used to checkout if the address just used is not the same as the previous order's shipping address
                    const lastUsedAddress = await BuyerShippingAddress.findOneAndUpdate({_id: data.object.metadata.lastUsedShipping, Buyer: loggedInUser._id}, {LastUsed: true}, {new: true})
                    console.log(111, "new last used address: ", lastUsedAddress) // null for logged in users who did not click Save Shipping in shipping form
                    
                }

                // Fulfill order by retrieving the items from the Cart document before deleting the cart later. While retrieving the Cart items, update the Electronic item quantity.
                const cart = await Cart.findOne({LoggedInBuyer: loggedInUser._id})
                const order = await Order.findOne({OrderNumber: cart._id})
                console.log(118, "create logged in order: ", order)

                let electronic
                for(let i=0; i < cart.Items.length; i++){

                    order.Items.push(cart.Items[i])

                    // Update inventory quantity of the items after items sold
                    electronic = await Electronic.findById(cart.Items[i].ItemId)
                    console.log(127, "before updated quantity electronic: ", electronic)

                    electronic.Quantity -= cart.Items[i].Quantity
                    
                }
                await order.save()
                await electronic.save()
            
                console.log(135, "after update electronic quantity: ", electronic)
                console.log(136, "added items to logged in order: ", order)

                // Add the shipping address and payment method used to confirm payment at checkout to the order document, after updating shipping address to have LastUsed: true property/creating an address with LastUsed: true property, and updating customer to have a last_used_payment metadata property.
                const orderLastUsedShipping = await BuyerShippingAddress.findOne({LastUsed: true, Buyer: loggedInUser._id})

                console.log(141, "find saved last used saved shipping: ", orderLastUsedShipping)

                const updateOrderWithShippingAndPayment = await Order.findOneAndUpdate({_id: order._id}, {
                    Shipping: {
                        Name: data.object.shipping.name,
                        Address: `${shippingAddress.line1}, ${shippingAddress.line2}, ${shippingAddress.city}, ${shippingAddress.state}, ${shippingAddress.postal_code}`
                    },
                    PaymentMethod: paymentMethodID,
                    TotalPrice: data.object.amount,
                    OrderDate: new Date(),
                    Complete: true
                }, {new: true})

                console.log(154, updateOrderWithShippingAndPayment)

                // Send back order to client via websocket. The socket is stored on req.io object from server middleware.
                console.log(157, cart._id)
                const socketDoc = await SocketID.find({cartID: cart._id})
                console.log(158, socketDoc)
                console.log(159, socketDoc[socketDoc.length-1].socketID)
                const socketID = socketDoc[socketDoc.length-1].socketID
                req.io.to(socketID).emit("completeOrder", {
                    order: updateOrderWithShippingAndPayment, 
                    payment: {
                        brand: paymentMethod.card.brand,
                        last4: paymentMethod.card.last4,
                        billingDetails: {
                            address: {
                                line1: paymentMethod.billing_details.address.line1,
                                line2: paymentMethod.billing_details.address.line2,
                                city:  paymentMethod.billing_details.address.city,
                                state:  paymentMethod.billing_details.address.state,
                                postalCode:  paymentMethod.billing_details.address.postal_code,
                                country:  paymentMethod.billing_details.address.country
                            },
                            name: paymentMethod.billing_details.name
                        } 
                    }
                })
                
                // Since there is a new cart for each order, delete cart after fulfilling order.
                const deletedCart = await Cart.findOneAndDelete({LoggedInBuyer: loggedInUser._id})

                console.log(189, "logged in cart deleted: ", deletedCart)

                // Delete CachePaymentIntent document
                const deletedCachePaymentIntent = await CachePaymentIntent.findOneAndDelete({PaymentIntentId: data.object.id})

                console.log(194, deletedCachePaymentIntent)

                // const deletedSockets = await SocketID.deleteMany({socketID: socketID})
                // console.log(191, "DELETED SOCKETS", deletedSockets)
                // console.log(192, "DELETING AFTER EMITTING ORDER VIA SOCKET")
                
            } else {
                // Fulfill order by retrieving the items from the Cart document before deleting the cart later. While retrieving the Cart items, update the Electronic item quantity.
                try {
                    const order = await Order.findOne({OrderNumber: data.object.metadata.order_number})
                    console.log(201, "create order: ", order)
            
                    const session = await req.sessionStore.get(data.object.metadata.order_number)
                    console.log(204, session)
                    
                    let electronic
                    for(let i=0; i < session.cart.length; i++) {
                        order.Items.push(session.cart[i])

                        // Update inventory quantity of the items sold
                        electronic = await Electronic.findById(session.cart[i].ItemId)
                        electronic.Quantity -= session.cart[i].Quantity
                    } 
                    await order.save()
                    await electronic.save()

                    console.log(218, "updated quantity in electronic: ", electronic)
                    console.log(219, "added items in guest order: ", order)

                    // Add the shipping address and payment method used to confirm payment at checkout to the order document.
                    // Get the shipping address from Payment Intent
                    // Get the payment method details using the payment method ID
                    const shipping = data.object.shipping.address
                    const updateOrderWithShippingAndPayment = await Order.findOneAndUpdate({_id: order._id}, {
                        Shipping: {
                            Name: data.object.shipping.name,
                            Address: `${shipping.line1}, ${shipping.line2}, ${shipping.city}, ${shipping.state}, ${shipping.postal_code}`
                        },
                        PaymentMethod: data.object.payment_method,
                        TotalPrice: data.object.amount,
                        OrderDate: new Date(),
                        Complete: true
                    }, {new: true})
                    
                    console.log(242, updateOrderWithShippingAndPayment)

                    // Get the payment method details since we need to send it back to the client via websocket
                    const paymentMethod = await stripe.paymentMethods.retrieve(data.object.payment_method)

                    // Send back order to client via websocket. The socket is stored on req.io object from server middleware.
                    const socketDoc = await SocketID.find({cartID: data.object.metadata.order_number})
                    console.log(249, socketDoc)
                    console.log(250, socketDoc[socketDoc.length-1].socketID)
                    const socketID = socketDoc[socketDoc.length-1].socketID
                    req.io.to(socketID).emit("completeOrder", {
                        order: updateOrderWithShippingAndPayment, 
                        payment: {
                            brand: paymentMethod.card.brand,
                            last4: paymentMethod.card.last4,
                            billingDetails: {
                                address: {
                                    line1: paymentMethod.billing_details.address.line1,
                                    line2: paymentMethod.billing_details.address.line2,
                                    city:  paymentMethod.billing_details.address.city,
                                    state:  paymentMethod.billing_details.address.state,
                                    postalCode:  paymentMethod.billing_details.address.postal_code,
                                    country:  paymentMethod.billing_details.address.country
                                },
                                name: paymentMethod.billing_details.name
                            }
                        }
                    })
                    console.log(270, "AFTER EMITTING ORDER VIA SOCKET")
                    // Disconnect the socket and delete the socket info in db since we have done the job of sending the info immediately after confirming payment
                    // req.io.on('end', async (socket) => {
                    //     await SocketID.deleteMany({socketID: socketID})
                    //     socket.disconnect(0)
                    // })

                    // console.log(277, "AFTER DELETING SOCKET")

                    // Since there is a new cart for each order, delete guest's session after fulfilling order.
                    await req.sessionStore.destroy(data.object.metadata.order_number, async function() {
                        const deletedSession = await req.sessionStore.get(data.object.metadata.order_number)
                        console.log(224, deletedSession)
                    })
                    // Delete CachePaymentIntent document
                    const deletedCachePaymentIntent = await CachePaymentIntent.findOneAndDelete({PaymentIntentId: data.object.id})

                    console.log(282, deletedCachePaymentIntent)

                    // const deletedSockets = await SocketID.deleteMany({socketID: socketID})
                    // console.log(282, "DELETED SOCKETS", deletedSockets)
                    // console.log(283, "DELETING AFTER EMITTING ORDER VIA SOCKET")

                } catch(error) {
                    console.log(285)
                    console.log(error)
                }
            }

        } catch(error) {
            console.log(291, error)
        }
    } 
    // Customer’s payment was declined by card network or otherwise expired
    else if (eventType === "payment_intent.payment_failed") { 

        // The payment failed to go through due to decline or authentication request 
        const error = data.object.last_payment_error.message;
        console.log(225, "❌ Payment failed with error: " + error);

        console.log(227, "status: ", data.object.status)

        // Prompt user to provide another payment method and attaching it to the already made payment intent by sending back to the payment intent's client secret
        // res.send({
        //     error: data.object.last_payment_error,
        //     clientSecret: data.object.client_secret,
        //     publicKey: process.env.STRIPE_PUBLIC
        // });

    } else if (eventType === "payment_method.attached") {

        // A new payment method was attached to a customer 
        console.log(239, "💳 Attached " + data.object.id + " to customer");
    }

    res.status(200).json({message: " WEBHOOK SUCCEDED !!!! "});
}

module.exports = {webhook}


// payment intent process webhook (happens when payment methods have delayed notification.): pending order and then if the payment intent status turns to succeed or requires payment method (the event is payment_intent.payment_failed), then do certain actions

// add the statement_descriptor to payment intent with Date.now()



// console.log(170, io.sockets)
// io.sockets.socket().emit("completeOrder", {order: updateOrderWithShippingAndPayment, payment: {
//     brand: paymentMethod.card.brand,
//     last4: paymentMethod.card.last4,
//     billingDetails: {
//         address: {
//             line1: paymentMethod.billing_details.address.line1,
//             line2: paymentMethod.billing_details.address.line2,
//             city:  paymentMethod.billing_details.address.city,
//             state:  paymentMethod.billing_details.address.state,
//             postalCode:  paymentMethod.billing_details.address.postal_code,
//             country:  paymentMethod.billing_details.address.country
//         },
//         name: paymentMethod.billing_details.name
//     }
// }})
// io.on('end', () => io.disconnect(0))
// ws.on('message', (msg) => {
//     ws.send(JSON.stringify({order: updateOrderWithShippingAndPayment, payment: {
//         brand: paymentMethod.card.brand,
//         last4: paymentMethod.card.last4,
//         billingDetails: {
//             address: {
//                 line1: paymentMethod.billing_details.address.line1,
//                 line2: paymentMethod.billing_details.address.line2,
//                 city:  paymentMethod.billing_details.address.city,
//                 state:  paymentMethod.billing_details.address.state,
//                 postalCode:  paymentMethod.billing_details.address.postal_code,
//                 country:  paymentMethod.billing_details.address.country
//             },
//             name: paymentMethod.billing_details.name
//         }
//     }}))
// })


// const finalOrder = await Order.findOne({OrderNumber: cart._id})
                // ee.emit('order')

                // Send back order to client via websocket 
                // const io = req.app.get('socketio')
                // console.log(169, io)
                // io.on('connection', (socket) => {
                //     console.log(170, 'Client connected');
                //     console.log(23, socket.id)

                //     socket.emit('socketID', socket.id)
                //     // const order = Order.findOne({Orde})
                //     // ee.on('order', () => {
                //     //   socket.emit('sendOrder', order)
                //     // })
                //     let completeOrder
                    
                //     socket.on('completeOrder', async (data) => {
                //       completeOrder = await Order.findOne({OrderNumber: data.cartID})
                //       console.log(34, completeOrder)
                //       console.log(35, data)
                //       io.to(socket.id).emit('recievedOrder', {order: completeOrder})
                //     })
                  
                //     // console.log(37, receivedData)
                //     // console.log(38, completeOrder)
                //     // io.to(receivedData.socketID).emit('recievedOrder', {order: completeOrder})
                //     // socket.on('end', (socket) => socket.disconnect(0))
                //     socket.on('disconnect', () => socket.removeAllListeners())
                //   })

                // io.on('connection', (socket) => {
                //     console.log(171)
                //     const socketId = socket.id
                //     console.log(173, socketId)
                //     io.to(socketId).emit("completeOrder", {order: updateOrderWithShippingAndPayment, payment: {
                //         brand: paymentMethod.card.brand,
                //         last4: paymentMethod.card.last4,
                //         billingDetails: {
                //             address: {
                //                 line1: paymentMethod.billing_details.address.line1,
                //                 line2: paymentMethod.billing_details.address.line2,
                //                 city:  paymentMethod.billing_details.address.city,
                //                 state:  paymentMethod.billing_details.address.state,
                //                 postalCode:  paymentMethod.billing_details.address.postal_code,
                //                 country:  paymentMethod.billing_details.address.country
                //             },
                //             name: paymentMethod.billing_details.name
                //         }
                //     }})
                // })