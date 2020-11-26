const {Electronic} = require('../../model/seller/electronic')
const Cart = require('../../model/buyer/cart')

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
                const cartItem = cart.Items.find((i) => {return i.itemId === req.params.id})

                // if the item exists then update quantity and total price in the cart
                if(cartItem) {
                    cartItem.Quantity += req.body.Quantity
                    cartItem.TotalPrice = (item.Price * cartItem.Quantity) // get price from server and not from client side to ensure charge is not made up
                } else { // if the item does not exist in the cart, then add the item
                    cart.Items.push({
                        itemId: item._id,
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
                const newCart = await Cart.create({
                    LoggedInBuyer: req.user._id,
                    Items: [{
                        itemId: item._id,
                        Name: item.Name,
                        Image: item.Image,
                        Brand: item.Brand,
                        Quantity: req.body.Quantity,
                        TotalPrice: req.body.Quantity * item.Price
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

module.exports = {loggedInAddItem}