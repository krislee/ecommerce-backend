const router = require('express').Router();
const User = require('../model/user')
const { authSchema } = require('../helpers/validation')
const bcrypt = require('bcrypt');

router.post('/register', async (req, res) => {
    try {
        // const { username, password, email } = req.body;
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
        const hashedPassword = await bcrypt.hash(req.body.password, 10)

        console.log(doesExistEmail, "doesexistemail")
        const user = await User.create({ username: req.body.username, password: hashedPassword, email: req.body.email})
        console.log(user, "user")
        const savedUser = await user.save();
        res.status(200).json(savedUser)
    } catch(err) {
        res.status(400).send(err)
    }
});

router.post('/login', async (req, res) => {
    const existUser = await User.findOne({username : req.body.username})

    if (!existUser){
        return res.status(400).send('Cannot find user')
    }

    try {
        if (await bcrypt.compare(req.body.password, existUser.password)){
            res.status(200).send('Success')
        } else {
            res.status(400).send('Not allowed')
        }
    } catch (err) {
        res.status(400).send(err)
    }
})

module.exports = router;