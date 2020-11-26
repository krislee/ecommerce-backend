const {Electronic} = require('../../model/seller/electronic')

// Guest user adds item to cart
const guestAddItem = async(req, res, next) => {
    try {
        console.log("guestadditem")

        const item = await Electronic.findById(req.params.id)
        console.log(item, "item in guest route")

        // if a cart has been made for the guest user, then check if the item is already in the cart 
        if(req.session.cart) {
            const cartItem = req.session.cart.find(i => i.Id == item.id)
            
            // if item exists in the cart, update quantity and total price
            if (cartItem) { 
                cartItem.Quantity += req.body.Quantity
                cartItem.TotalPrice = cartItem.Quantity * item.Price
            } else { // if item does not exists, then add the item to the cart
                req.session.cart.push({
                    ItemId: item.id,
                    Name: item.Name,
                    Brand: item.Brand,
                    Image: item.Image,
                    Quantity: req.body.Quantity,
                    TotalPrice: req.body.Quantity * item.Price
                })
            }

            console.log(req.session, "guest cart after adding item")
            res.status(200).json(req.session.cart);

        } else { // if the cart has not been made for the guest user, then make the cart with the item user is adding
            req.session.cart = 
                [{
                    ItemId: item.id,
                    Name: item.Name,
                    Image: item.Image,
                    Brand: item.Brand,
                    Quantity: req.body.Quantity,
                    TotalPrice: req.body.Quantity * item.Price
                }]
            
            console.log(req.session, "guest cart made to add item")
            res.status(200).json(req.session.cart);
        }

    }
    catch (error) {
        res.status(400).send(error)
    }
}

module.exports = {guestAddItem}