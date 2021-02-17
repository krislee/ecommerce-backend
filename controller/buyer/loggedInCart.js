const {Electronic} = require('../../model/seller/electronic')
const Cart = require('../../model/buyer/cart')

// Add or update item from ITEM'S DESCRIPTION PAGE to shopping cart. The add button in description page would have the item's id as the CSS id.

// Logged in user adds item to cart
const loggedInAddItem = async(req, res, next) => {
    try {
        console.log(9, req.user)
        if (req.user) {
            console.log(11, req.params.id, "req.params.id")
            const item = await Electronic.findById(req.params.id)
            console.log(13, item, 'finding item')

            const cart = await Cart.findOne({LoggedInBuyer: req.user._id})
            console.log(16, cart, "logged in cart")

            // if cart exists
            if (cart) {

                // check if the cart contains the item by seeing if the item is in the Items array
                const cartItem = cart.Items.find((i) => {
                    console.log(i.ItemId, typeof i.id, "i.id")
                    console.log(req.params.id, typeof req.params.id, "req.params.id")
                    return i.ItemId === req.params.id
                })
                console.log(27, cartItem, "cartItem")
                // if the item exists then update quantity and total price in the cart
                if(cartItem) {
                    console.log(30, "cart quantity: ", cartItem.Quantity, typeof cartItem.Quantity)
                    console.log(31, "req quantity: ",  req.body.Quantity, typeof req.body.Quantity)
                    cartItem.Quantity = Number(cartItem.Quantity)
                    cartItem.Quantity += Number(req.body.Quantity)
                    console.log(34, "cart quantity: ", cartItem.Quantity, typeof cartItem.Quantity, "req quantity: ",  req.body.Quantity, typeof req.body.Quantity)
                    cartItem.TotalPrice = (item.Price * cartItem.Quantity) // get price from server and not from client side to ensure charge is not made up
                } else { // if the item does not exist in the cart, then add the item
                    console.log(37)
                    cart.Items.push({
                        ItemId: item._id,
                        Name: item.Name,
                        Brand: item.Brand,
                        Image: item.Image,
                        Quantity: req.body.Quantity,
                        TotalPrice: req.body.Quantity * item.Price
                    })
                    console.log(46, cart)
                }

                await cart.save()

                const updatedCartWithItem = await Cart.findOne({LoggedInBuyer: req.buyer._id}).select({ "Items.Quantity": 1});
                console.log(51, updatedCartWithItem)
                return res.status(200).json(cart)

            } else { // if cart does not exist create a new cart to hold the added item 
                console.log(" new cart will be made for logged in user ")
                const newCart = await Cart.create({
                    LoggedInBuyer: req.user._id,
                    Items: [{
                        ItemId: item._id,
                        Name: item.Name,
                        Image: item.Image,
                        Brand: item.Brand,
                        Quantity: req.body.Quantity,
                        TotalPrice: req.body.Quantity * item.Price
                    }]
                })
   
                console.log(newCart, "new cart successfully made for logged in user")
                return res.status(200).json(newCart)
            }
        }
    }
    catch (error) {
        return res.status(400).send(error)
    }
}


// Sync cart of logged in user in case user added items to cart when logged out and then logs back in
// Add items from guest shopping cart to logged in shopping cart when guest logs in 
const addItemsFromGuestToLoggedIn = async (req, res) => {
    const sessionCart = req.session.cart
    console.log(74, "req session: ", req.session)
    console.log(75, "req sessionID: ", req.sessionID)
    console.log(76, sessionCart, "sessionCart after logging in")
    // console.log(req.user, "req.user after logging in")

    const cart = await Cart.findOne({LoggedInBuyer: req.user._id})
    console.log(cart, "cart after logging in in the addItemsFromGuestToLoggedIn")

    if (cart) {
        if (sessionCart) { // if there is a cart in the session because the user was not logged in when adding items, then add the items to the cart of a logged in user
            // console.log(sessionCart[0].Id, typeof sessionCart[0].Id, "sessionCart[i].id")
            // console.log(cart.Items[0].itemId, typeof cart.Items[0].itemId, "cart.Items[0].itemId")
            for (let i = 0; i < sessionCart.length; i++) {
                // check if the logged in cart already contains the item that was in the session cart

                const cartItem = cart.Items.find((j) => {

                    console.log(91, "guest adding in loop", sessionCart[i].ItemId)

                    return j.ItemId == sessionCart[i].ItemId
                })

                console.log(96, "cart item in the addItemsFromGuestToLoggedIn: ", cartItem)

                if (cartItem) {
                    console.log(99, "if in the addItemsFromGuestToLoggedIn")

                    cartItem.Quantity += sessionCart[i].Quantity

                    console.log(103, "quantity in addItemsFromGuestToLoggedIn: ", cartItem.Quantity)
                    console.log(104, "cart total price: ", cartItem.TotalPrice)

                    cartItem.TotalPrice += sessionCart[i].TotalPrice

                    console.log(107, "price in addItemsFromGuestToLoggedIn: ", cartItem.TotalPrice)
                } else {

                    console.log(111, "else in the addItemsFromGuestToLoggedIn")
                    console.log(112, "guest adding in else: ", sessionCart[i].ItemId )

                    cart.Items.push({
                        ItemId: sessionCart[i].ItemId,
                        Name: sessionCart[i].Name,
                        Brand: sessionCart[i].Brand,
                        Image: sessionCart[i].Image,
                        Quantity: sessionCart[i].Quantity,
                        TotalPrice: sessionCart[i].TotalPrice
                    })

                    console.log(114, "cart.Items after pushing in else: ", cart.Items)
                }
            }
           
            await cart.save()

            console.log(120, "adding items from guest to logged in cart: ", cart)

            // then delete the cart from the session after adding all the items from cart
            delete req.session.cart;

            console.log(125, "after deleting session: ", req.session)
        }

        return res.status(200).json({successful: "added items to OLD cart after SYNCING", cart: cart})
    } else {
        const newCart = await Cart.create({
            LoggedInBuyer: req.user._id
        })
        
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

            await newCart.save()

            // then delete the cart from the session after adding all the items from cart
            delete req.session.cart

            console.log(162, "after deleting session: ", req.session)
        }

        console.log(165, "new cart for adding items from guest to logged in cart: ", newCart)

        return res.status(200).json({successful: "created a NEW cart and SYNC items", cart: newCart})
    }
}

// Update item quantity on client's SHOPPING CART PAGE. The update button in shopping cart's page would have the item's id as the CSS id. Since we are updating the quantity of the item, then the cart already exists so in this route controller we do not need to check if a cart exists or make a new cart.
const loggedInUpdateItemQuantity = async (req, res) => {
    try {
        if(req.user){
            console.log(176)
            const item = await Electronic.findById(req.params.id)
            console.log(178, item)
            const cart = await Cart.findOne({LoggedInBuyer: req.user._id}) 
            console.log(180, cart)
            const cartItem = cart.Items.find(i => {return i.ItemId == item._id})
            console.log(182, cartItem)
            cartItem.Quantity = req.body.Quantity
            cartItem.TotalPrice = (item.Price * req.body.Quantity)
            await cart.save()
            console.log(188, cart, "updated cart after save!")

            let totalCartPrice = 0
            if(cart) {
                for (let i=0; i < cart.Items.length; i++) {
                    totalCartPrice += cart.Items[i].TotalPrice
                }
            }
            return res.status(200).json({cart: cart, totalCartPrice: totalCartPrice})
        }
    }
    catch (error) {
        return res.status(400).send(error)
    }
} 

// Delete item from shopping cart page. The delete button will have the CSS id as electronic document id.
const loggedInDeleteItem = async (req, res) => {
    try {
        if(req.user){
            const cart = await Cart.findOne({LoggedInBuyer: req.user._id})
            console.log(207, cart, "find logged in cart for delete")
            const cartItemIndex = await cart.Items.findIndex(i => {return i.ItemId == req.params.id})
            console.log(209, cartItemIndex, "find delete index login")
            cart.Items.splice(cartItemIndex, 1)
            await cart.save()
            console.log(212, cart, "logged in cart after deleting")

            let totalCartPrice = 0
            if(cart) {
                for (let i=0; i < cart.Items.length; i++) {
                    totalCartPrice += cart.Items[i].TotalPrice
                }
            }
            return res.status(200).json({cart: cart, totalCartPrice: totalCartPrice})
        } 
    } catch(error) {
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
            let totalCartPrice = 0
            if(cart) {
                for (let i=0; i < cart.Items.length; i++) {
                    totalCartPrice += cart.Items[i].TotalPrice
                }
                
                // console.log(cart, "logged in cart")

                if(cart.Items.length !== 0) {
                    return res.status(200).json({
                        cart: cart,
                        totalCartPrice: totalCartPrice
                    })
                } else {
                    return res.status(200).json({cart: 'No cart available'}) // When users log in, syncing occurs so a cart is created with the possibility of no items in the cart, so we need to send 'No cart available back'.
                }
            } else {
                return res.status(200).json({cart: 'No cart available'}) // Send 'No cart available' back when there is no cart, i.e. after a successful payment the old cart is deleted so there won't be any cart
            }
        }
    }
    catch(error) {
        return res.status(400).send(error)
    }
}

// Get cart ID
const getCartID = async(req, res) => {
    try {
        console.log(req.user, 'user');
        if(req.user) {
            const cart = await Cart.findOne({LoggedInBuyer: req.user._id})
            return res.status(200).json({cartID: cart._id})
        }
    }
    catch(error) {
       return res.status(400).send(error)
    }
}


module.exports = {loggedInAddItem, addItemsFromGuestToLoggedIn, loggedInUpdateItemQuantity, loggedInDeleteItem, loggedInIndexCart, getCartID}