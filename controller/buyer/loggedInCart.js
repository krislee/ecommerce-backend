const {Electronic} = require('../../model/seller/electronic')
const Cart = require('../../model/buyer/cart')

// Add or update item from ITEM'S DESCRIPTION PAGE to shopping cart. The add button in description page would have the item's id as the CSS id.

// Logged in user adds item to cart
const loggedInAddItem = async(req, res, next) => {
    try {
        if (req.user) {

            const item = await Electronic.findById(req.params.id)

            const cart = await Cart.findOne({LoggedInBuyer: req.user._id})
            console.log(15, cart)
            // if cart exists
            if (cart) {
                // check if the cart contains the item by seeing if the item is in the Items array
                const cartItem = cart.Items.find((i) => {
                    return i.ItemId === req.params.id
                })
                console.log(22, cartItem, "cartItem")
                // if the item exists then update quantity and total price in the cart
                if(cartItem) {
                    // Since we are adding EXTRA items, update the Items.Quantity and Items.TotalPrice field in cart document by adding
                    cartItem.Quantity += Number(req.body.Quantity)
                    cartItem.TotalPrice = (item.Price * cartItem.Quantity) // get price from server and not from client side to ensure charge is not made up
                    // Since we are adding EXTRA items, update the TotalCartPrice and TotalItems field in cart document by adding
                    cart.TotalCartPrice += (Number(req.body.Quantity) * item.Price)// get price from server and not from client side to ensure charge is not made up
                    cart.TotalItems += Number(req.body.Quantity)
                } else { // if the item does not exist in the cart, then add the item to Items field of cart documnet
                    cart.Items.push({
                        ItemId: item._id,
                        Name: item.Name,
                        Brand: item.Brand,
                        Image: item.Image,
                        Quantity: (Number(req.body.Quantity)),
                        TotalPrice: Number(req.body.Quantity) * item.Price
                    })
                    // Also, update the TotalCartPrice and TotalItems fields of cart document by adding since we are adding EXTRA items
                    cart.TotalCartPrice += (Number(req.body.Quantity) * item.Price)
                    cart.TotalItems += (Number(req.body.Quantity))
                }

                await cart.save()
                console.log(46, cart)

                return res.status(200).json({cart: cart})

            } else { // if user is logged in and adds an item but a cart does not exist (whether it is because user is 1st time adding items or had a cart deleted after order),create a new cart to hold the added item 
                console.log(" new cart will be made for logged in user ")
                const newCart = await Cart.create({
                    LoggedInBuyer: req.user._id,
                    Items: [{
                        ItemId: item._id,
                        Name: item.Name,
                        Image: item.Image,
                        Brand: item.Brand,
                        Quantity: req.body.Quantity,
                        TotalPrice: Number(req.body.Quantity) * item.Price
                    }],
                    TotalCartPrice: Number(req.body.Quantity) * item.Price,
                    TotalItems: Number(req.body.Quantity)
                })
   
                console.log(66, newCart)
                return res.status(200).json({cart: newCart})
            }
        }
    }
    catch (error) {
        console.log(72, error)
        return res.status(400).send(error)
    }
}


// Sync cart of logged in user in case user added items to cart when logged out and then logs back in
// Add items from guest shopping cart to logged in shopping cart when guest logs in 
const addItemsFromGuestToLoggedIn = async (req, res) => {
    try {
        const sessionCart = req.session.cart
        console.log(82, "req sessionID: ", req.sessionID)
        console.log(83, sessionCart, "sessionCart after logging in")
        // console.log(req.user, "req.user after logging in")

        const cart = await Cart.findOne({LoggedInBuyer: req.user._id})
        console.log(87, cart)

        if (cart) {
            if (sessionCart) { // if there is a cart in the session because the user was not logged in when adding items, then add the items to the cart of a logged in user

                for (let i = 0; i < sessionCart.length; i++) {
                    const item = await Electronic.findById(sessionCart[i].ItemId)
                    console.log(95, "ITEM", item.Name, item.Price)
                    // check if the logged in cart already contains the item that was in the session cart by finding the Items subdocument
                    const cartItem = cart.Items.find((j) => {
                        return j.ItemId == sessionCart[i].ItemId
                    })
                    let totalItemQuantity
                    // If item is already in the logged in cart, then update only the Quantity and TotalPrice of the Items subdocument
                    if (cartItem) {
                        totalItemQuantity = cartItem.Quantity + sessionCart[i].Quantity
                        console.log(103, totalItemQuantity)
                        if(totalItemQuantity > 10) {
                            cart.TotalCartPrice += ((10-cartItem.Quantity) * item.Price)
                            cart.TotalItems += (10-cartItem.Quantity)

                            cartItem.Quantity = 10
                            cartItem.TotalPrice = 10 * item.Price

                        } else {
                            cartItem.Quantity += sessionCart[i].Quantity
                            cartItem.TotalPrice += sessionCart[i].TotalPrice
                            cart.TotalItems += sessionCart[i].Quantity
                            cart.TotalCartPrice += sessionCart[i].TotalPrice
                        }
                        
                    } else { // If the item from the guest cart is not in the logged in cart, then add a new Items subdocument to the cart document
                        cart.Items.push({
                            ItemId: sessionCart[i].ItemId,
                            Name: sessionCart[i].Name,
                            Brand: sessionCart[i].Brand,
                            Image: sessionCart[i].Image,
                            Quantity: sessionCart[i].Quantity,
                            TotalPrice: sessionCart[i].TotalPrice
                        })
                        cart.TotalItems += sessionCart[i].Quantity
                        cart.TotalCartPrice += sessionCart[i].TotalPrice
                    }
                }

                await cart.save()

                console.log(121, "adding items from guest to logged in cart: ", cart)

                // then delete the cart from the session after adding all the items from cart
                req.sessionStore.destroy(req.sessionID)

                console.log(126, "after deleting session: ", req.session)
            }

            return res.status(200).json({successful: "added items to OLD cart after SYNCING", cart: cart})
        } else {
            // If logged in user does not have a cart yet when guest user logs in, then make a cart first before we can add items from guest cart to logged in cart
            const newCart = await Cart.create({
                LoggedInBuyer: req.user._id,
                TotalCartPrice: 0,
                TotalItems: 0
            })

            console.log(136, newCart)

            if (sessionCart) { // if there is a cart in the session because the user was not logged in when adding items, then add the items to the newly created cart of a logged in user
                for (let i = 0; i < sessionCart.length; i++) {
                    
                    newCart.Items.push({
                        ItemId: sessionCart[i].ItemId,
                        Name: sessionCart[i].Name,
                        Brand: sessionCart[i].Brand,
                        Image: sessionCart[i].Image,
                        Quantity: sessionCart[i].Quantity,
                        TotalPrice: sessionCart[i].TotalPrice
                    })
                
                }

                newCart.TotalCartPrice = req.session.totalCartPrice
                newCart.TotalItems = req.session.totalItems

                await newCart.save()

                // then delete the cart from the session after adding all the items from cart
                delete req.session

                console.log(162, "after deleting session: ", req.session)
            }

            console.log(165, "new cart for adding items from guest to logged in cart: ", newCart)

            return res.status(200).json({successful: "created a NEW cart and SYNC items", cart: newCart})
        }
    } catch(error) {
        console.log(171, error)
        res.status(400).json({error: error})
    }
}

// Update item quantity on client's SHOPPING CART PAGE. The update button in shopping cart's page would have the item's id as the CSS id. Since we are updating the quantity of the item, then the cart already exists so in this route controller we do not need to check if a cart exists or make a new cart.
const loggedInUpdateItemQuantity = async (req, res) => {
    try {
        if(req.user){
            const item = await Electronic.findById(req.params.id)
            const cart = await Cart.findOne({LoggedInBuyer: req.user._id}) 
            console.log(182, cart)

            const cartItem = cart.Items.find(i => {return i.ItemId == item._id})
            console.log(185, cartItem)
            console.log(186, cart.TotalItems)
            cart.TotalItems += ( Number(req.body.Quantity) - cartItem.Quantity) // take the difference of how many items since we are updating not adding additional items
            cart.TotalCartPrice += (item.Price * ( Number(req.body.Quantity) - cartItem.Quantity))
            console.log(189, cart.TotalItems, cart.TotalCartPrice)
            cartItem.Quantity = Number(req.body.Quantity)
            cartItem.TotalPrice = (item.Price * Number(req.body.Quantity))

            await cart.save()
            console.log(194, cart, "updated cart after save!")


            return res.status(200).json({cart: cart})
        }
    }
    catch (error) {
        console.log(201, error)
        return res.status(400).send(error)
    }
} 

// Delete item from shopping cart page. The delete button will have the CSS id as electronic document id.
const loggedInDeleteItem = async (req, res) => {
    try {
        if(req.user){
            const cart = await Cart.findOne({LoggedInBuyer: req.user._id})
            console.log(211, cart, "find logged in cart for delete")

            const cartItemIndex = await cart.Items.findIndex(i => {return i.ItemId == req.params.id})
            cart.TotalItems -= cart.Items[cartItemIndex].Quantity
            cart.TotalCartPrice -= cart.Items[cartItemIndex].TotalPrice
            cart.Items.splice(cartItemIndex, 1)

            await cart.save()
            console.log(219, cart, "logged in cart after deleting")

            return res.status(200).json({cart: cart})
        } 
    } catch(error) {
        console.log(224, error)
        return res.status(400).send(error)
    }
}

// Show all items in the cart
const loggedInIndexCart = async(req, res) => {
    console.log('logged in indexCart route used');

    try {
        // console.log(req.user, 'user');
        if(req.user) {
            const cart = await Cart.findOne({LoggedInBuyer: req.user._id})

            if(cart) {
                if(cart.Items.length !== 0) {
                    return res.status(200).json({ cart: cart })
                } else {
                    return res.status(200).json({cart: 'No cart available'}) // When users log in, syncing occurs so a cart is created with the possibility of no items in the cart, so we need to send 'No cart available back'.
                }
            } else {
                return res.status(200).json({cart: 'No cart available'}) // Send 'No cart available' back when there is no cart, i.e. after a successful payment the old cart is deleted so there won't be any cart
            }
        }
    }
    catch(error) {
        console.log(250, error)
        return res.status(400).send(error)
    }
}

// Get cart ID
const getCartID = async(req, res) => {
    try {
        if(req.user) {
            const cart = await Cart.findOne({LoggedInBuyer: req.user._id})
            return res.status(200).json({cartID: cart._id})
        }
    }
    catch(error) {
       return res.status(400).send(error)
    }
}

// Get Quantity of a specific item (used to check how many items have already been added)
const guestCartItemQuantity = async(req, res) => {
    try {
        if(req.user) {
            const cart = await Cart.findOne({"Items.ItemId": req.params.id}, {'Items.$': 1})
            res.status(200).json({item: cart})
        }
    } 
    catch(error) {
        console.log(278, error)
        return res.status(400).send(error)
     }
}

module.exports = {loggedInAddItem, addItemsFromGuestToLoggedIn, loggedInUpdateItemQuantity, loggedInDeleteItem, loggedInIndexCart, getCartID, guestCartItemQuantity}


 // const updatedCartWithItem = await Cart.findOne({LoggedInBuyer: req.user._id}, {_id: 0}).select('Items.Quantity')
// console.log(56, updatedCartWithItem)
// const totalQuantity = updatedCartWithItem.Items.reduce((total, quantity) => {
//     console.log(58,quantity)
//     return total + quantity['Quantity']
// }, 0)

// const cart = await Cart.findOne({"Items.ItemId": req.params.id}, {'Items.$': 1}, (error, item) => {
//     console.log(273, item)
//     res.status(200).json({item: item})
// })
