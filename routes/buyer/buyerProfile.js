const express = require('express');
const passport = require('passport');
const router = express.Router();
const {index, update, destroy} = require('../../controller/buyer/buyerProfile');


passportAuthenticate = passport.authenticate('jwt', {session: false}, 
    // async(req, res) => {
    //     console.log(8, "PASSPORT AUTHENTICATE REQ PROFILE\n------------\n", req)
    //     console.log(9, "PASSPORT AUTHENTICATE RES PROFILE\n------------\nRES:", res)
    // }
)


router.get('/profile', passportAuthenticate, index)

router.put('/profile', passportAuthenticate, update);

router.delete('/profile', passportAuthenticate, destroy);



module.exports = router