const {Electronic} = require('../../model/seller/electronic')
const Cart = require('../../model/buyer/cart')

// Add or update item from ITEM'S DESCRIPTION PAGE to shopping cart. The add button in description page would have the item's id as the CSS id.

// Logged in user adds item to cart
const loggedInAddItem = async(req, res, next) => {
    try {
        if (req.user) {
            const item = await Electronic.findById(req.params.id)
            const cart = await Cart.find({LoggedInBuyer: req.user._id})

            console.log(cart, "logged in cart")

            // if cart exists
            if (await cart) {
                    
                // check if the cart contains the item by seeing if the item is in the Items array
                    const cartItem = cart.Items.find(i => i.Id === item.id)

                    // if the item exists then update quantity and total price in the cart
                    if(cartItem) {
                        cartItem.Quantity += req.body.Quantity
                        cartItem.TotalPrice = (item.Price * cartItem.Quantity) // get price from server and not from client side to ensure charge is not made up
                    } else { // if the item does not exist in the cart, then add the item
                        cart.Items.push({
                            Id: item.id,
                            Name: item.Name,
                            Brand: item.Brand,
                            Image: item.Image,
                            Quantity: req.body.Quantity,
                            TotalPrice: req.body.Quantity * item.Price
                        })
                    }
                
                await cart.save()

                console.log(cart, "updated logged in user's cart")

                res.status(200).json(cart)

            } else { // create a new cart to hold the added item if cart does not exist
                const newCart = await Cart.create({
                    LoggedInBuyer: req.user._id,
                    Items: [{
                        Id: item.id,
                        Name: item.Name,
                        Image: item.Image,
                        Brand: item.Brand,
                        Quantity: req.body.Quantity,
                        TotalPrice: req.body.Quantity * item.Price
                    }]
                })

                console.log(newCart, "new cart created for logged in user")

                res.status(200).json(newCart)
            }
        } else {
            guestAddItem()
        }
        // next();
    }
    catch (error) {
        res.status(400).send(error)
    }
}

// Guest user adds item to cart
const guestAddItem = async(req, res, next) => {
    try {
        // if user is not logged in, then there would be no req.user obj and the following would run
        if (!req.user) {
            const item = await Electronic.findById(req.params.id)

            console.log(item, "guest trying to add item")

            // if a cart has been made for the guest user, then check if the item is already in the cart 
            if(req.session.cart) {
                const cartItem = req.session.cart.find(i => i.Id == item.id)
                
                // if item exists in the cart, update quantity and total price
                if (cartItem) { 
                    cartItem.Quantity += req.body.Quantity
                    cartItem.TotalPrice = cartItem.Quantity * item.Price
                } else { // if item does not exists, then add the item to the cart
                    req.session.cart.push({
                        Id: item.id,
                        Name: item.Name,
                        Brand: item.Brand,
                        Image: item.Image,
                        Quantity: req.body.Quantity,
                        TotalPrice: req.body.Quantity * item.Price
                    })
                }

                console.log(req.session.cart, "guest cart after adding item")

            } else { // if the cart has not been made for the guest user, then make the cart with the item user is adding
                req.session.cart = 
                    [{
                        Id: item.id,
                        Name: item.Name,
                        Image: item.Image,
                        Brand: item.Brand,
                        Quantity: req.body.Quantity,
                        TotalPrice: req.body.Quantity * item.Price
                    }]
                
                console.log(req.session.cart, "guest cart made to add item")
            }

            res.status(200).json(req.session.cart);
        }

        // next() // runs loggedInAddItem() for logged in user since the if(!req.user) statement would not run
    }
    catch (error) {
        res.status(400).send(error)
    }
}

// Add items from guest shopping cart to logged in shopping cart when guest logs in 
const addItemsFromGuestToLoggedIn = async (req, res) => {
    const sessionCart = req.session.cart
    const cart = await Cart.find({LoggedInBuyer: req.user._id})

    if (cart) {
        if (sessionCart) { // if there is a cart in the session because the user was not logged in when adding items, then add the items to the cart of a logged in user
            for (let i = 0; i < sessionCart.length; i++) {
                // check if the logged in cart already contains the item that was in the session cart
                const cartItem = cart.Items.find(j => j.Id == sessionCart[i].id)

                if (cartItem) {
                    cartItem.Quantity += sessionCart[i].Quantity
                    cartItem.TotalPrice += sessionCart.TotalPrice
                } else {
                    cart.Items.push({
                        Id: sessionCart[i].id,
                        Name: sessionCart[i].Name,
                        Brand: sessionCart[i].Brand,
                        Image: sessionCart[i].Image,
                        Quantity: sessionCart[i].Quantity,
                        TotalPrice: sessionCart[i].TotalPrice
                    })
                }
            }
            
            await cart.save()

            console.log(cart, "adding items from guest to logged in cart")

            // then delete the cart from the session after adding all the items from cart
            delete sessionCart
        }

        res.status(200).json({successful: true})
    } else {
        const newCart = await Cart.create({
            LoggedInBuyer: req.user._id
        })

        if (sessionCart) { // if there is a cart in the session because the user was not logged in when adding items, then add the items to the cart of a logged in user
            for (let i = 0; i < sessionCart.length; i++) {
                // check if the logged in cart already contains the item that was in the session cart
                const cartItem = newCart.Items.find(j => j.Id == sessionCart[i].id)

                if (cartItem) {
                    cartItem.Quantity += sessionCart[i].Quantity
                    cartItem.TotalPrice += sessionCart.TotalPrice
                } else {
                    cart.Items.push({
                        Id: sessionCart[i].id,
                        Name: sessionCart[i].Name,
                        Brand: sessionCart[i].Brand,
                        Image: sessionCart[i].Image,
                        Quantity: sessionCart[i].Quantity,
                        TotalPrice: sessionCart[i].TotalPrice
                    })
                }
            }
            
            await cart.save()

            // then delete the cart from the session after adding all the items from cart
            delete sessionCart
        }

        console.log(newCart, "new cart for adding items from guest to logged in cart")

        res.status(200).json({successful: true})
    }

    res.status(400).json({successful: false})
}

// Update item quantity on client's SHOPPING CART PAGE. The update button in shopping cart's page would have the item's id as the CSS id. Since we are updating the quantity of the item, then the cart already exists so in this route controller we do not need to check if a cart exists or make a new cart.
const loggedInUpdateItemQuantity = async (req, res) => {
    try {
        if(req.user){
            const item = await Electronic.findById(req.params.id)
            const cart = await Cart.find({LoggedInBuyer: req.user._id})
            
            const cartItem = await cart.Items.find(i => i.Id == item.id)
            cartItem.Quantity = req.body.Quantity
            cartItem.TotalPrice = (item.Price * req.body.Quantity)

            await cart.save()

            res.status(200).json(cart)
        }
    }
    catch (error) {
        res.status(400).send(error)
    }
} 

const guestUpdateItemQuantity = async(req, res) => {
    try {
        if(!req.user) {
            const item = await Electronic.findById(req.params.id)

            const cartItem = req.session.cart.find(i => i.Id == item.id)

            cartItem.Quantity = req.body.Quantity
            cartItem.TotalPrice = (item.Price * req.body.Quantity)

            res.status(200).json(req.session.cart)
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
            const cart = await Cart.find({LoggedInBuyer: req.user._id})

            const cartItemIndex = await cart.Items.findIndex(i => i.Id == req.params.id)
            await cart.Items.splice(cartItemIndex, 1)

            await cart.save()

            res.status(200).json(cart)
        } 
    } catch(error) {
        res.status(400).send(error)
    }
}

const guestDeleteItem = (req, res) => {
    try {
        if (!req.user) {
            const cartItemIndex = req.session.cart.findIndex(i => i.Id == req.params.id)
            req.session.cart.splice(cartItemIndex, 1)
            res.status(200).json(req.session.cart)
        }
    }
    catch(error) {
        res.status(400).send(error)
    }
}

// REMEMBER TO DELETE CART OBJECT FROM MONGO OR SESSION WHEN STRIPE PURCHASE IS MADE!!!!!


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

const guestIndexCart = (req, res) => {
    console.log('guest indexCart route used');

    try {
        if(!req.user) {
            console.log("guest cart")
            res.status(200).json(req.session.cart)
        }
    }
    catch(error) {
        res.status(400).send(error)
    }
}

module.exports = {loggedInIndexCart, guestIndexCart, loggedInAddItem, guestAddItem, addItemsFromGuestToLoggedIn, loggedInUpdateItemQuantity, guestUpdateItemQuantity, loggedInDeleteItem, guestDeleteItem}

// Helpful resources:
// https://stackoverflow.com/questions/55049421/add-items-to-cart-without-the-user-logged-in-react-js-and-redux
// https://stackoverflow.com/questions/59174763/how-to-add-product-to-shopping-cart-with-nodejs-express-and-mongoose


////// LOCAL STORAGE NOTES //////
// if using local storage when clicking add button in the item description page:
// create const cartObj = []
// hit the server: const item = await Electronic.findById(req.params.id); res.status(200).json(item)
// then after receiving from the server push the items to cartObj each time the add item button is clicked or update quantity
    // if the item does not exist in the cartObj: 
        // cartObj.push({id: item.id, name: item.Name, brand: item.Brand, image: item.Image, quantity: input.value, totalPrice: input.value * item.Price})
    // if the item exists first in the cartObj:
        // const cartItem = cartObject.find(i => i.id == e.target.id)
        // if(cartItem) {cartItem.quantity += input.value; cartItem.totalPrice = cartItem.quantity * item.Price}
// localStorage.setItem("cart", JSON.stringify(cartObj)) 
    // need to keep resetting the local storage every time the user adds items

// when clicking on the shopping cart, display the items in the shopping cart: 
    // const cart = JSON.parse(localStorage.getItem("cart"))

// updating the quantities in the shopping cart from local storage:
    // hit the server: const item = await Electronic.findById(req.params.id); res.status(200).json(item)
    // then after receiving from the server:
        // const cart = cartObject.find(i => i.id == e.target.id)
        // cart.quantity = input.value
        // cart.totalPrice = input.value * item.Price
        // localStorage.setItem("cart", JSON.stringify(cartObj)) 
        // JSON.parse(localStorage.getItem("cart"))

// delete item from local storage shopping cart:
    // const cartItemIndex = cartObject.findIndex(i => i.id == e.target.id)
    // cart.splice(cartItemIndex, 1)
    // localStorage.setItem("cart", JSON.stringify(cartObj)) 
    // JSON.parse(localStorage.getItem("cart"))