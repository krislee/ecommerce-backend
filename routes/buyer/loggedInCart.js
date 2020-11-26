const {Electronic} = require('../../model/seller/electronic')
const Cart = require('../../model/buyer/cart');
const router = require('express').Router();
const passport = require('passport');

const passportAuthenticate = passport.authenticate('jwt', {session: false})

const authCheck = (err, req, res, next) => {
    console.log(err)
    if(!req.user) {
        console.log("hi")
        res.redirect(307, '/guest/cart/')
    } else {
        next()
    }
}
// Add or update item from ITEM'S DESCRIPTION PAGE to shopping cart. The add button in description page would have the item's id as the CSS id.

// Logged in user adds item to cart
const loggedInAddItem = async(req, res, next) => {
    try {
        console.log(req.user, 'requser');
        if (req.user) {
            const item = await Electronic.findById(req.params.id)
            const cart = await Cart.find({LoggedInBuyer: req.user._id})

            console.log(req.params.id)
            console.log(item, "item")
            console.log(cart, "logged in cart")

            // if cart exists
            if (cart.length > 0) {
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
                console.log("blah blah")
                console.log(item, "item inside")
                console.log(typeof ("string"))
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
                // newCart.save();
                res.status(200).json(newCart)
            }
        }
        // next();
        res.send("loggedincart")
    }
    catch (error) {
        res.status(400).send(error)
    }
}

router.post('/', passportAuthenticate, loggedInAddItem)

module.exports = router