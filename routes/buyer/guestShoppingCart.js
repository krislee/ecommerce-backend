const express = require('express');
const router = express.Router();

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
                res.status(200).json(req.session.cart);

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
                res.status(200).json(req.session.cart);
            }
        }

        next() // runs loggedInAddItem() for logged in user since the if(!req.user) statement would not run
    }
    catch (error) {
        res.status(400).send(error)
    }
}

router.post('/', guestAddItem)

module.exports = router