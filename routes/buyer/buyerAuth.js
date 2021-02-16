const router = require('express').Router();
const {BuyerUser} = require('../../model/buyer/buyerUser')
const {SellerUser} = require('../../model/seller/sellerUser')
const { authSchema } = require('../../auth/validation')
const bcrypt = require('bcrypt');
const {issueJWT} = require('../../auth/issueJWT');
const { exist } = require('@hapi/joi');


router.post('/register', async (req, res) => {
    try {
        // const { username, password, email } = req.body;
        console.log(13)
        const result = await authSchema.validateAsync(req.body);
        console.log(14, result)
        // Check if email user is trying to register acct with is already in the db
        const doesExistEmail = await BuyerUser.findOne({email: result.email.toLowerCase()})
        const doesExistSellerEmail = await SellerUser.findOne({email: result.email.toLowerCase()})
        if (doesExistEmail || doesExistSellerEmail) {
            res.status(400).json({success: false, emailMsg: `${result.email} is already registered.`})
            return
        }
        console.log(22, doesExistEmail)
        console.log(23, doesExistSellerEmail)
        // Check if username is trying to register acct with is already in the db
        const doesExistUser = await BuyerUser.findOne({ username: result.username})
        const doesExistSellerUser = await SellerUser.findOne({username: result.username})
        if (doesExistUser || doesExistSellerUser) {
            res.status(400).json({success: false, usernameMsg:`${result.username} is already taken. Please try a different one.`})
            return
        }
        console.log(31, doesExistUser)
        console.log(32, doesExistSellerEmail)
        // If email and username are not in the db, then do the following:

        // 1) Hash and Salt the provided password
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        console.log(36, hashedPassword)
        // 2) Create and save the created user to db
        const user = await BuyerUser.create({ username: req.body.username, password: hashedPassword, oldPasswords: hashedPassword, email: req.body.email.toLowerCase(), buyer: true, name: req.body.name})
        const savedUser = await user.save();
        console.log(36, "user: ", user)
        // 3) Create JWT token for successfully registered user
        const registerToken = issueJWT(savedUser)

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

router.post('/login', async (req, res, next) => {

    // Find user by unique username
    const existUser = await BuyerUser.findOne({username : req.body.username})
    console.log(57, "exist user", existUser)
    if (!existUser){
        return res.status(400).json({success: false, msg: 'Cannot find user'})
    }

    try {
        // Unsalts the salted-hashed password in db to get the hashed database password and hashes the provided password and compares them
        if (await bcrypt.compare(req.body.password, existUser.password)){
            console.log(65)
            //  Create JWT token for successfully logged in user
            const loginToken = await issueJWT(existUser)
            console.log(68, "login token", loginToken)
            res.status(200).json({
                success: true,
                user: existUser,
                token: loginToken.token, 
                expiresIn: loginToken.expires
            })
        } else {
            res.status(400).json({success: false, msg: 'Wrong password'})
        }

        next() // run addItemsFromGuestToLoggedIn() so that if there were items in the cart when user was not logged in, we update the cart automatically when the user is logged back in
    } catch (err) {
        res.status(400).send(err)
    }
})

module.exports = router