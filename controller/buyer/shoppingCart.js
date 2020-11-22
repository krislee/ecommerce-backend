const {Electronic} = require('../../model/seller/electronic')
const Cart = require('../../model/buyer/cart')

// Add or update item from ITEM'S DESCRIPTION PAGE to shopping cart. The add button in description page would have the item's id as the CSS id.
const addOrUpdateItem = async(req, res) => {
    try {
        const item = await Electronic.findById(req.params.id)
        // console.log(req.user);
        if (req.user) {
            const cart = await Cart.find({LoggedInBuyer: req.user._id})
            // console.log('testcart')
            // if cart exists
            if  (await cart) {
                // check if the cart contains the item by seeing if the item is in the Items array
                const cartItem = cart.Items.find(i => i.Id === item.id)
                console.log(item)

                // if the item exists then update quantity and total price in the cart
                if(cartItem) {
                    cartItem.Quantity += req.body.Quantity
                    cartItem.TotalPrice += (item.Price * req.body.Quantity) // get price from server and not from client side to ensure charge is not made up
                } else {
                    cart.Items.push({
                        Id: item.id,
                        Name: item.Name,
                        Brand: item.Brand,
                        Image: item.Image,
                        Quantity: 1,
                        TotalPrice: item.Price
                    })
                }

                await cart.save()

                res.status(200).json(cart)
            } else { // create a new cart to hold the items if cart does not exist
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

                res.status(200).json(newCart)
            }
        } else {
            if(req.session.cart) {
                const cartItem = req.session.cart.find(i => i.Id == item.id)
                console.log(cartItem, 'cartItem')
                if (cartItem) {
                    cartItem.Quantity += req.body.Quantity
                    cartItem.TotalPrice += (req.body.Quantity * item.Price) 
                } else {
                    req.session.cart.push({
                        Id: item.id,
                        Name: item.Name,
                        Brand: item.Brand,
                        Image: item.Image,
                        Quantity: req.body.Quantity,
                        Price: item.Price
                    })
                }
                console.log(req.sessions.cart, 'cartItems');
                res.status(200).json(req.session.cart);
            } else {
                req.session.cart = 
                    [{
                        Id: item.id,
                        Name: item.Name,
                        Image: item.Image,
                        Brand: item.Brand,
                        Quantity: req.body.Quantity,
                        Price: req.body.Quantity * item.Price
                    }]
                
                res.status(200).json(req.session.cart.Items)
            }
        }
    }
    catch (error) {
        res.status(400).send(error)
    }
}

// Update item quantity on client's SHOPPING CART PAGE. The update button in shopping cart's page would have the item's id as the CSS id. Since we are updating the quantity of the item, then the cart already exists so in this route controller we do not need to check if a cart exists or make a new cart.
const updateItemQuantity = async (req, res) => {
    try {
        const item = await Electronic.findById(req.params.id)
        
        if(req.user.buyer){
            const cart = await Cart.find({LoggedInBuyer: req.user._id})
            
            const cartItem = await cart.Items.find(i => i.Id == item.id)
            cartItem.Quantity += req.body.Quantity
            cartItem.totalPrice += (item.Price * req.body.Quantity)

            await cart.save()

            res.status(200).json(cart)
        } else if (!req.user) {
            const cartItem = req.session.cart.Items.find(i => i.Id == item.id)

            cartItem.Quantity += req.body.Quantity
            cartItem.totalPrice += (item.Price * req.body.Quantity)

            res.status(200).json(req.session.cart.Items)
        }
    }
    catch (error) {
        res.status(400).send(error)
    }
} 

// Show all items in the cart
const indexCart = async(req, res) => {
    try {
        if(req.user.buyer) {
            const cart = await Cart.find({LoggedInBuyer: req.user._id})
            res.status(200).json(cart.Items)
        } else if (!req.user) {
            res.status(200).json(req.session.cart.Items)
        }
    }
    catch(error) {
        res.status(400).send(error)
    }
}

// Delete item from shopping cart page
const deleteItem = async (req, res) => {
    try {
        const item = await Electronic.findById(req.params.id)

        if(req.user.buyer){
            const cart = await Cart.find({LoggedInBuyer: req.user._id})

            const cartItemIndex = await cart.Items.findIndex(i => i.Id == item.id)
            await cart.Items.splice(cartItemIndex, 1)

            await cart.save()

            res.status(200).json(cart)
        } else if (!req.user) {
            const cartItemIndex = req.session.cart.Items.findIndex(i => i.Id == item.id)
            cart.Items.splice(cartItemIndex, 1)
            res.status(200).json(req.session.cart.Items)
        }
    } catch(error) {
        res.status(400).send(error)
    }
}



// remember to delete cart object when purchase is made 


// https://stackoverflow.com/questions/55049421/add-items-to-cart-without-the-user-logged-in-react-js-and-redux
// https://stackoverflow.com/questions/59174763/how-to-add-product-to-shopping-cart-with-nodejs-express-and-mongoose

module.exports = {addOrUpdateItem, updateItemQuantity, deleteItem}

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