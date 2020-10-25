const {SellerUser} = require('../../model/seller/sellerUser')
const {Electronic} = require('../../model/seller/electronic')
const BuyerUser = require('../../model/buyer/buyerUser')

const { emailSchema, passwordSchema } = require('../../auth/validation')
const bcrypt = require('bcrypt');

// GETTING SELLER PROFILE
const index = async (req, res) => {
    try {
        if (req.user.seller){
            const sellerProfile = await SellerUser.findOne({_id: req.user._id})
            const electronicItems = await Electronic.find({Seller: sellerProfile._id})
            res.status(200).json({
                id: sellerProfile._id,
                username: sellerProfile.username,
                email: sellerProfile.email,
                electronicItems: electronicItems
            });
        } else {
            res.status(400).json({msg: "You are not authorized to view this profile."})
        }
    }
    catch (error) {
        res.status(400).send(error);
    }
}

// UPDATING SELLER PROFILE
const update = async (req, res) => {
    try {
        if (req.user.seller){
            if (req.body.email){
                 // Check if email is validated 
                const validatedEmail = await emailSchema.validateAsync(req.body)

                // 
                // Check if email exists in the database 
                const doesExistSellerEmail = await SellerUser.findOne({email: result.email})
                const doesExistBuyerEmail = await BuyerUser.findOne({email: result.email})

                // If email exists in the database or is the current email then return. Else update the email.
                if (req.user.email === req.body.email) {
                    return res.status(200).json({msg: "This is your current email. Please change to a new email address."})
                } else if (doesExistBuyerEmail || doesExistSellerEmail) {
                    return res.status(200).json({msg: "An account with this email is already registered."})
                } else {
                    const updateSeller = await SellerUser.findOneAndUpdate({_id: req.user.id}, req.body, {new: true}) // {new:true} to return the document after updating
                    console.log(updateSeller)
                    if (updateSeller){
                        res.status(200).json({
                            id: updateSeller._id,
                            username: updateSeller.username,
                            email: updateSeller.email
                        });
                    } 
                }
            } 
            [1] 
            
            if (req.body.password) {
                // Check if password is valid
                const validatedPassword = await passwordSchema.validateAsync(req.body)

                // Check if entered password is the last 5 old passwords seller made
                console.log(validatedPassword, "validated password")
                seller= await SellerUser.findById(req.user._id)
                // console.log(seller.oldPasswords, "previous passwords")
                // console.log(seller, "seller")
                for (let i = 0; i < seller.oldPasswords.length; i ++) {
                    const comparePasswords = await bcrypt.compare(req.body.password, seller.oldPasswords[i])

                    if (comparePasswords) {
                        return res.status(200).json({msg: "Your password cannot be your last 5 passwords."})
                    }
                }

                 // Hash and salt new password
                 const newPassword = await bcrypt.hash(req.body, 10)
                 console.log(newPassword, "new password")

                 // Update seller's password
                 await Seller.findOneAndUpdate({_id: req.user.id}, req.body, {new:true})

                if (await seller.oldPasswords.length == 5) {

                    // Take out the oldest password
                    await seller.oldPasswords.shift()

                    // Push in new hashed salted password
                    await seller.oldPasswords.push(seller.password)
                } else if (await seller.oldPasswords.length < 5) {

                    // Push in new hashed salted password
                    await seller.oldPasswords.push(seller.password)
                }

                return res.status(200).json({
                    id: updateSeller._id,
                    username: updateSeller.username,
                    email: updateSeller.email
                })
            }
        } else {
            res.status(400).json({msg: "You are not authorized to update this profile."})
        }
    }
    catch (error) {
        console.log(error, "error")
        res.status(400).send(error);
    }
}

// DELETING SELLER PROFILE AND ITS ELECTRONICS
const destroy = async (req, res) => {
    try {
        if (req.user.seller){
            await SellerUser.findById(req.user.id, function(err, seller) {

                const queryElectronicItems = Electronic.find({_id: {$in: seller.electronicItems}})

                // Delete reviews of the electronic items
                queryElectronicItems.deleteMany()

                // Runs the pre deleteOne hook in seller schema. Then deletes the seller and its electronic items
                seller.deleteOne()
                res.status(200).json("Successfully deleted seller's profile")
            })
        
        } else {
            res.status(400).json({msg: "You are not authorized to delete this profile."})
        }
    }
    catch (error) {
        res.status(400).send(error);
    }
}

module.exports = {index, update, destroy}