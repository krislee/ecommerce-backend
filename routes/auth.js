const router = require('express').Router();
const User = require('../models/user')

router.post('/register', async (req, res) => {
    // const user = new User({
    //     username: req.body.username,
    //     email: req.body.email,
    //     password: req.body.password
    // });
    try {
        const user = await User.create(req.body)
        const savedUser = await user.save();
        res.send(savedUser)
    } catch(err) {
        res.status(400).send(err)
    }
});

module.exports = router;