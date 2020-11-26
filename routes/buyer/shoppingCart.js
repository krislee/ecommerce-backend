const express = require('express');
const router = express.Router();

router.get('/electronic/cart', passportAuthenticate)

router.post('/electronic/cart/:id', (req, res) => {
    if(!req.headers.authorization) {
        res.redirect(307, `/guestbuyer/${req.params.id}`)
    } else {
        res.redirect(307, `/loginbuyer/${req.params.id}`)
    }
});

router.put('/electronic/cart/:id', passportAuthenticate)

router.delete('/electronic/cart/:id', passportAuthenticate)

module.exports = router

// Resources:
// https://stackoverflow.com/questions/27056195/nodejs-express-validator-with-passport
// https://stackoverflow.com/questions/46094417/authenticating-the-request-header-with-express
// https://stackoverflow.com/questions/19146176/javascript-empty-array-evaluates-to-true-in-conditional-structures-why-is
// https://stackoverflow.com/questions/19035373/how-do-i-redirect-in-expressjs-while-passing-some-context
// https://stackoverflow.com/questions/59174763/how-to-add-product-to-shopping-cart-with-nodejs-express-and-mongoose
// https://stackoverflow.com/questions/38810114/node-js-with-express-how-to-redirect-a-post-request