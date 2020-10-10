const router = require('express').Router();
const User = require('../model/user')

router.post('/register', async (req, res) => {
    try {
        const user = await User.create(req.body)
        const savedUser = await user.save();
        res.send(savedUser)
    } catch(err) {
        res.status(400).send(err)
    }
});

module.exports = router;