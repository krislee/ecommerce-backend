const router = require('express').Router();
const User = require('../model/user')
const { authSchema } = require('../helpers/validation')
const bcrypt = require('bcrypt');
const {issueJWT} = require('../utils')


router.post('/register', async (req, res) => {
    try {
        // const { username, password, email } = req.body;
        const result = await authSchema.validateAsync(req.body);
        console.log(result, "result")

        // Check if email user is trying to register acct with is already in the db
        const doesExistEmail = await User.findOne({email: result.email})
        if (doesExistEmail) {
            res.status(400).send(`${result.email} is already registered.`)
            return
        }

        // Check if username is trying to register acct with is already in the db
        const doesExistUser = await User.findOne({ username: result.username})
        if (doesExistUser) {
            res.status(400).send(`${result.username} is already taken. Please try a different one.`)
            return
        }

        // If email and username are not in the db, then do the following:

        // Hash and Salt the provided password
        const hashedPassword = await bcrypt.hash(req.body.password, 10)

        // Create and save the created user to db
        const user = await User.create({ username: req.body.username, password: hashedPassword, email: req.body.email})
        const savedUser = await user.save();
        console.log(user, "user")
        console.log(savedUser, "savedUser")
        // Create JWT token for registered user
        const registerToken = await issueJWT(user)

        res.status(200).json({
            success: true,
            user: savedUser,
            token: registerToken.token, 
            expiresIn: registerToken.expires
        })
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

            //  Create JWT token for successfully logged in user
            const loginToken = utils.issueJWT(existUser)

            res.status(200).json({
                success: true,
                user: existUser,
                token: loginToken.token, 
                expiresIn: loginToken.expires
            })
        } else {
            res.status(400).json({success: false, msg: 'Wrong password'})
        }
    } catch (err) {
        res.status(400).send(err)
    }
})

module.exports = router;