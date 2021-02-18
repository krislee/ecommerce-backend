const {BuyerUser} = require('../../model/buyer/buyerUser')
const {SellerUser} = require('../../model/seller/sellerUser')
const {ElectronicReview} = require('../../model/buyer/reviewElectronic')

const { emailSchema, passwordSchema } = require('../../auth/validation')
const bcrypt = require('bcrypt');

// GETTING BUYER PROFILE
const index = async (req, res) => {
    try {
        if (req.user.buyer){

            // Find the buyer user document in the db
            const buyerProfile = await BuyerUser.findOne({_id: req.user._id})

            // Find all the reviews the buyer made
            const BuyerReviews = await ElectronicReview.find({Buyer: buyerProfile._id})

            return res.status(200).json({
                id: buyerProfile._id,
                username: buyerProfile.username,
                email: buyerProfile.email,
                reviews: BuyerReviews
            });
        } else {
            return res.status(400).json({msg: "You are not authorized to view this profile."})
        }
    }
    catch (error) {
        return res.status(400).send(error);
    }
}

// UPDATING BUYER PROFILE
const update = async (req, res) => {
    try {
        if (req.user.buyer){
            if (req.body.email){
                 // Check if email is validated 
                await emailSchema.validateAsync(req.body)
                const email = req.body.email.toLowerCase()
                console.log(42, email)
                // Check if email exists in the database 
                const doesExistSellerEmail = await SellerUser.findOne({email: email})
                const doesExistBuyerEmail = await BuyerUser.findOne({email: email})

                // If email exists in the database or is the current email then return. Else update the email.
                if (req.user.email.toLowerCase() === email) {
                    return res.status(200).json({msg: "This is your current email. Please change to a new email address."})
                } else if (doesExistBuyerEmail || doesExistSellerEmail) {
                    return res.status(200).json({msg: "An account with this email is already registered."})
                } else {
                    const updateBuyer = await BuyerUser.findOneAndUpdate({_id: req.user.id}, {email: email}, {new: true}) // {new:true} to return the document after updating
 
                    if (updateBuyer){
                        return res.status(200).json({
                            id: updateBuyer._id,
                            username: updateBuyer.username,
                            email: updateBuyer.email
                        });
                    } 
                }
            } else if (req.body.password) {
                // Check if password is valid
                await passwordSchema.validateAsync(req.body)
                
                // Grab the buyer document
                const buyer = await BuyerUser.findById(req.user._id)

                // Check if the entered password seller is trying to update is the last 5 (or less) passwords. If it is, return.
                for (let i = 0; i < buyer.oldPasswords.length; i ++) {
                    const comparePasswords = await bcrypt.compare(req.body.password, buyer.oldPasswords[i])

                    if (comparePasswords) {
                        return res.status(200).json({msg: "Your password cannot be your last 5 passwords."})
                    }
                }

                // If the entered password is not the same as the last 5 (or less) passwords (seller can make the same password as long as it is not the most recent 5 passwords), then:

                // Hash and salt new password
                const newPassword = await bcrypt.hash(req.body.password, 10)

                // Initialize variable that will store the updated seller
                let updateBuyer
                
                if (await buyer.oldPasswords.length == 5) {
                    // Remove the oldest password aka 1st password in the oldPasswords array
                    updateBuyer = await BuyerUser.findOneAndUpdate({_id: req.user._id}, {password: newPassword, $pop: {oldPasswords: -1}, }, {new:true})
                    // Then add the newly updated password to the oldPasswords array
                    updateBuyer= await BuyerUser.findOneAndUpdate({_id: req.user._id}, {$push: {oldPasswords: newPassword}}, {new:true})

                } else if (await buyer.oldPasswords.length < 5) {
                    // Do not need to remove from oldPasswords array since the length of the array is not 5 yet
                    updateBuyer = await BuyerUser.findOneAndUpdate({_id: req.user._id}, {password: newPassword, $push: {oldPasswords: newPassword}}, {new:true})
                }

                return res.status(200).json({
                    id: updateBuyer._id,
                    username: updateBuyer.username,
                    email: updateBuyer.email
                })
            }
        } else {
            return res.status(400).json({msg: "You are not authorized to update this profile."})
        }
    }
    catch (error) {
        console.log(error, "error")
        return res.status(400).send(error);
    }
}


// DELETING BUYER PROFILE 
const destroy = async (req, res) => {
    try {
        if (req.user.buyer){
            await BuyerUser.findById(req.user.id, function(err, buyer) {

                // Trigger the deleteOne pre hook on the BuyerUser model, and then runs deleteOne() method on the buyer document
                buyer.deleteOne()

                return res.status(200).json({success: true})
            })
        } else {
           return res.status(400).json({msg: "You are not authorized to delete this profile."})
        }
    }
    catch (error) {
       return res.status(400).send(error);
    }
}

module.exports = {index, update, destroy}