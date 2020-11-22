const {Electronic} = require('../../model/seller/electronic')
const Cart = require('../../model/buyer/cart')

// Add or update item from ITEM'S DESCRIPTION PAGE to shopping cart. The add button in description page would have the item's id as the CSS id.
const addOrUpdateItem = async(req, res) => {
    try {
        if(req.user.buyer){
            const cart = await Cart.find({Buyer: req.user._id})
            const item = await Electronic.findById(req.params.id)

            // if cart exists
            if  (await cart) {
                // check if the cart contains the item by seeing if the item is in the Items array
                const cartItem = cart.Items.find(i => i.Id === item.id)
                console.log(item)

                // if the item exists then update quantity and total price in the cart
                if(cartItem) {
                    cartItem.Quantity += req.body.Quantity
                    cartItem.totalPrice += (item.Price * req.body.Quantity) // get price from server and not from client side to ensure charge is not made up
                } else {
                    cart.Items.push({
                        Id: item.id,
                        Name: item.Name,
                        Brand: item.Brand,
                        Image: item.Image,
                        Quantity: 1,
                        Price: item.Price
                    })
                }

                await cart.save()

                res.status(200).json(cart)
            } else { // create a new cart to hold the items if cart does not exist
                const newCart = await Cart.create({
                    Buyer: req.user._id,
                    Items: [{
                        Id: item.id,
                        Name: item.Name,
                        Image: item.Image,
                        Brand: item.Brand,
                        Quantity: req.body.Quantity,
                        Price: req.body.Quantity * item.Price
                    }]
                })

                res.status(200).json(newCart)
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
        if(req.user.buyer) {
            const item = await Electronic.findById(req.params.id)
            const cart = await Cart.find({Buyer: req.user._id})
            
            const cartItem = await cart.Items.find(i => i.Id == item.id)
            cartItem.Quantity += req.body.Quantity
            cartItem.totalPrice += (item.Price * req.body.Quantity)

            await cart.save()

            res.status(200).json(cart)
        }
    }
    catch (error) {
        res.status(400).send(error)
    }
} 

// Delete item from shopping cart page
const deleteItem = async (req, res) => {
    try {
        if(req.user.buyer) {
            const item = await Electronic.findById(req.params.id)
            const cart = await Cart.find({Buyer: req.user._id})

            const cartItemIndex = await cart.Items.findIndex(i => i.Id == item.id)
            await cart.Items.splice(cartItemIndex, 1)

            await cart.save()

            res.status(200).json(cart)
        }
    } catch(error) {
        res.status(400).send(error)
    }
}

const deleteItem

// delete cart object when purchase is made 


// https://stackoverflow.com/questions/55049421/add-items-to-cart-without-the-user-logged-in-react-js-and-redux
// https://stackoverflow.com/questions/59174763/how-to-add-product-to-shopping-cart-with-nodejs-express-and-mongoose