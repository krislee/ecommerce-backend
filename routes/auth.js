const router = require('express').Router();
const User = require('../model/user')
const { authSchema } = require('../helpers/validation')

router.post('/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;
        const result = await authSchema.validateAsync(req.body);
        console.log(result, "result")
        const doesExistEmail = await User.findOne({email: result.email})
        if (doesExistEmail) {
            res.status(400).send(`${result.email} is already registered.`)
            return
        }
        const doesExistUser = await User.findOne({ username: result.username})
        if (doesExistUser) {
            res.status(400).send(`${result.username} is already taken. Please try a different one.`)
            return
        }
        console.log(doesExistEmail, "doesexistemail")
        const user = await User.create(req.body)
        console.log(user, "user")
        const savedUser = await user.save();
        res.status(200).json(savedUser)
    } catch(err) {
        res.status(400).send(err)
    }
});

module.exports = router;