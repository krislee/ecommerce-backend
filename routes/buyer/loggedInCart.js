const router = require('express').Router();
const passport = require('passport');
const passportAuthenticate = passport.authenticate('jwt', {session: false})

const {loggedInAddItem} = require('../../controller/buyer/loggedInCart')

router.post('/:id', passportAuthenticate, loggedInAddItem)

module.exports = router
