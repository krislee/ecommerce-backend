const {Electronic} = require('../../model/seller/electronic')
const Cart = require('../../model/buyer/cart')
const { session } = require('passport')

// Add or update item from ITEM'S DESCRIPTION PAGE to shopping cart. The add button in description page would have the item's id as the CSS id.

// Logged in user adds item to cart
const loggedInAddItem = async(req, res, next) => {
    try {
        if (req.user) {
            console.log(req.params.id, "req.params.id")
            const item = await Electronic.findById(req.params.id)
            console.log(item, 'finding item')

            const cart = await Cart.findOne({LoggedInBuyer: req.user._id})
            console.log(cart, "logged in cart")

            // if cart exists
            if (cart) {

                // check if the cart contains the item by seeing if the item is in the Items array
                const cartItem = cart.Items.find((i) => {
                    console.log(i.ItemId, typeof i.id, "i.id")
                    console.log(req.params.id, typeof req.params.id, "req.params.id")
                    return i.ItemId === req.params.id
                })
                console.log(cartItem, "cartItem")
                // if the item exists then update quantity and total price in the cart
                if(cartItem) {
                    cartItem.Quantity += req.body.Quantity
                    cartItem.TotalPrice = (item.Price * cartItem.Quantity) // get price from server and not from client side to ensure charge is not made up
                } else { // if the item does not exist in the cart, then add the item
                    cart.Items.push({
                        ItemId: item._id,
                        Name: item.Name,
                        Brand: item.Brand,
                        Image: item.Image,
                        Quantity: req.body.Quantity,
                        TotalPrice: req.body.Quantity * item.Price
                    })
                }
                
                await cart.save()
                res.status(200).json(cart)

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
                res.status(200).json(newCart)
            }
        }
    }
    catch (error) {
        res.status(400).send(error)
    }
}


// Sync cart of logged in user in case user added items to cart when logged out and then logs back in
// Add items from guest shopping cart to logged in shopping cart when guest logs in 
const addItemsFromGuestToLoggedIn = async (req, res) => {
    const sessionCart = req.session.cart

    console.log(sessionCart, "sessionCart after logging in")
    console.log(req.user, "req.user after logging in")

    const cart = await Cart.findOne({LoggedInBuyer: req.user._id})
    console.log(cart, "cart after logging in in the addItemsFromGuestToLoggedIn")

    if (cart) {
        if (sessionCart) { // if there is a cart in the session because the user was not logged in when adding items, then add the items to the cart of a logged in user
            // console.log(sessionCart[0].Id, typeof sessionCart[0].Id, "sessionCart[i].id")
            // console.log(cart.Items[0].itemId, typeof cart.Items[0].itemId, "cart.Items[0].itemId")
            for (let i = 0; i < sessionCart.length; i++) {
                // check if the logged in cart already contains the item that was in the session cart

                const cartItem = cart.Items.find((j) => {
                    console.log(sessionCart[i].ItemId, "guest adding in loop")
                    return j.ItemId == sessionCart[i].ItemId
                })

                console.log(cartItem, "cart item in the addItemsFromGuestToLoggedIn")

                if (cartItem) {
                    console.log("if in the addItemsFromGuestToLoggedIn")
                    cartItem.Quantity += sessionCart[i].Quantity
                    console.log(cartItem.Quantity, "quantity in addItemsFromGuestToLoggedIn ")
                    console.log(cartItem.TotalPrice, "cart total price")
                    cartItem.TotalPrice += sessionCart[i].TotalPrice
                    console.log(cartItem.TotalPrice, "price in addItemsFromGuestToLoggedIn ")
                } else {
                    console.log("else in the addItemsFromGuestToLoggedIn")
                    console.log(sessionCart[i].ItemId, "guest adding in else")
                    cart.Items.push({
                        ItemId: sessionCart[i].ItemId,
                        Name: sessionCart[i].Name,
                        Brand: sessionCart[i].Brand,
                        Image: sessionCart[i].Image,
                        Quantity: sessionCart[i].Quantity,
                        TotalPrice: sessionCart[i].TotalPrice
                    })
                    console.log(cart.Items, "cart.Items after pushing in else")
                }
            }
            
            await cart.save()

            console.log(cart, "adding items from guest to logged in cart")

            // then delete the cart from the session after adding all the items from cart
            delete req.session.cart;

            console.log(req.session, "after deleting session")
        }

        res.status(200).json({successful: "added items to OLD cart after SYNCING"})
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
            console.log(req.session, "after deleting session")
        }

        console.log(newCart, "new cart for adding items from guest to logged in cart")

        res.status(200).json({successful: "created a NEW cart and SYNC items"})
    }
}

// Update item quantity on client's SHOPPING CART PAGE. The update button in shopping cart's page would have the item's id as the CSS id. Since we are updating the quantity of the item, then the cart already exists so in this route controller we do not need to check if a cart exists or make a new cart.
const loggedInUpdateItemQuantity = async (req, res) => {
    try {
        if(req.user){
            const item = await Electronic.findById(req.params.id)
            const cart = await Cart.findOne({LoggedInBuyer: req.user._id}) 

            const cartItem = cart.Items.find(i => {return i.ItemId == item._id})

            cartItem.Quantity = req.body.Quantity
            cartItem.TotalPrice = (item.Price * req.body.Quantity)

            await cart.save()
            console.log(cart, "updated cart after save!")
            res.status(200).json(cart)
        }
    }
    catch (error) {
        res.status(400).send(error)
    }
} 

// Delete item from shopping cart page. The delete button will have the CSS id as electronic document id.
const loggedInDeleteItem = async (req, res) => {
    try {
        if(req.user){
            const cart = await Cart.findOne({LoggedInBuyer: req.user._id})
            console.log(cart, "find logged in cart for delete")
            const cartItemIndex = await cart.Items.findIndex(i => {return i.ItemId == req.params.id})
            console.log(cartItemIndex, "find delete index login")
            cart.Items.splice(cartItemIndex, 1)
            await cart.save()
            console.log(cart, "logged in cart after deleting")
            res.status(200).json(cart)
        } 
    } catch(error) {
        res.status(400).send(error)
    }
}

// Show all items in the cart
const loggedInIndexCart = async(req, res) => {
    console.log('logged in indexCart route used');

    try {
        console.log(req.user, 'user');
        if(req.user) {
            const cart = await Cart.find({LoggedInBuyer: req.user._id})
            console.log(cart, "logged in cart")
            res.status(200).json(cart)
        }
    }
    catch(error) {
        res.status(400).send(error)
    }
}

module.exports = {loggedInAddItem, addItemsFromGuestToLoggedIn, loggedInUpdateItemQuantity, loggedInDeleteItem, loggedInIndexCart}