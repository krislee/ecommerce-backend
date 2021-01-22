const router = require('express').Router();
const {BuyerUser} = require('../../model/buyer/buyerUser')
const {SellerUser} = require('../../model/seller/sellerUser')
const { authSchema } = require('../../auth/validation')
const bcrypt = require('bcrypt');
const {issueJWT} = require('../../auth/issueJWT')


router.post('/register', async (req, res) => {
    try {
        // const { username, password, email } = req.body;
        const result = await authSchema.validateAsync(req.body);
        // Check if email user is trying to register acct with is already in the db
        const doesExistEmail = await BuyerUser.findOne({email: result.email})
        const doesExistSellerEmail = await SellerUser.findOne({email: result.email})
        if (doesExistEmail || doesExistSellerEmail) {
            res.status(400).json({success: false, msg: `${result.email} is already registered.`})
            return
        }

        // Check if username is trying to register acct with is already in the db
        const doesExistUser = await BuyerUser.findOne({ username: result.username})
        const doesExistSellerUser = await SellerUser.findOne({username: result.username})
        if (doesExistUser || doesExistSellerUser) {
            res.status(400).json({success: false, msg:`${result.username} is already taken. Please try a different one.`})
            return
        }

        // If email and username are not in the db, then do the following:

        // 1) Hash and Salt the provided password
        const hashedPassword = await bcrypt.hash(req.body.password, 10)

        // 2) Create and save the created user to db
        const user = await BuyerUser.create({ username: req.body.username, password: hashedPassword, oldPasswords: hashedPassword, email: req.body.email, buyer: true})
        const savedUser = await user.save();

        // 3) Create JWT token for successfully registered user
        const registerToken = await issueJWT(savedUser)

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

    if (!existUser){
        return res.status(400).json({success: false, msg: 'Cannot find user'})
    }

    try {
        // Unsalts the salted-hashed password in db to get the hashed database password and hashes the provided password and compares them
        if (await bcrypt.compare(req.body.password, existUser.password)){

            //  Create JWT token for successfully logged in user
            const loginToken = await issueJWT(existUser)

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