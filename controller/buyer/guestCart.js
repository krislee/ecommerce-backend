const {Electronic} = require('../../model/seller/electronic')

// Guest user adds item to cart
const guestAddItem = async(req, res, next) => {
    try {
        console.log("guestadditem")
        
        const item = await Electronic.findById(req.params.id)
        // console.log(item, "item in guest route")
        console.log("req.session: ", req.session)
        console.log("session id: ", req.sessionID)
        // console.log("cookies: ", req.signedCookies.cookies)
        // if a cart has been made for the guest user, then check if the item is already in the cart 
        // if (req.sessionID)
        if(req.session.cart) {
            const cartItem = req.session.cart.find(i => i.ItemId == item.id)
            
            // if item exists in the cart, update quantity and total price
            if (cartItem) { 
                console.log(cartItem.Quantity, req.body.Quantity)
                console.log(typeof cartItem.Quantity)
                // cartItem.Quantity += req.body.Quantity
                cartItem.Quantity = Number(cartItem.Quantity)
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
            req.session.save()
            console.log("added item to guest cart:", req.session)
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
            req.session.save()
            console.log("guest cart is made to add item: ", req.session)
            res.status(200).json(req.session.cart);
        }

    }
    catch (error) {
        console.log("error: ", error)
        res.status(400).send(error)
    }
}

// Update item quantity on client's SHOPPING CART PAGE. The update button in shopping cart's page would have the item's id as the CSS id. Since we are updating the quantity of the item, then the cart already exists so in this route controller we do not need to check if a cart exists or make a new cart.
const guestUpdateItemQuantity = async(req, res) => {
    try {
       
        const item = await Electronic.findById(req.params.id)
        // console.log("update guest cart item: ", item)
        console.log("req.session: ", req.session)
        const cartItem = req.session.cart.find(i => {
            console.log(i.ItemId, "guest i.ItemId")
            return i.ItemId == item.id
        })
        console.log(cartItem, "guest update cart")
        cartItem.Quantity = req.body.Quantity
        cartItem.TotalPrice = (item.Price * req.body.Quantity)
        console.log(cartItem, "after updating guest cart")
        res.status(200).json(req.session.cart)
        
    }
    catch (error) {
        console.log("error: ", error)
        res.status(400).send(error)
    }
}

// Delete item from shopping cart page. The delete button will have the CSS id as electronic document id.
const guestDeleteItem = (req, res) => {
    try {

        const cartItemIndex = req.session.cart.findIndex(i => i.ItemId == req.params.id)
        req.session.cart.splice(cartItemIndex, 1)
        console.log(req.session.cart, "guest cart after delete")
        if(req.session.cart.length === 0) delete req.session.cart
        res.status(200).json(req.session.cart)
    }
    catch(error) {
        res.status(400).send(error)
    }
}

// Show all items in the cart
const guestIndexCart = (req, res) => {
    console.log('guest indexCart route used');
    console.log("session ID :", req.sessionID)
    console.log('guestIndexCart', req.session)
    try {
            console.log(req.session.cart, "guest cart")
            
            let totalCartPrice = 0
            for (let i=0; i < req.session.cart.length; i++) {
                totalCartPrice += req.session.cart[i].TotalPrice
            }
            res.status(200).json({
                cart: req.session.cart,
                totalCartPrice: totalCartPrice
            })
        
    }
    catch(error) {
        console.log("error", error)
        res.status(400).send(error)
    }
}

module.exports = {guestAddItem, guestUpdateItemQuantity, guestDeleteItem, guestIndexCart}