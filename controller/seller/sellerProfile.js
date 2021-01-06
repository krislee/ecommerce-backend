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

            res.status(200).json({
                id: sellerProfile._id,
                username: sellerProfile.username,
                email: sellerProfile.email,
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
                await emailSchema.validateAsync(req.body)

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
            
            if (req.body.password) {
                // Check if password is valid
                const validatedPassword = await passwordSchema.validateAsync(req.body)
                
                // Grab the seller document
                seller = await SellerUser.findById(req.user._id)

                // Check if the entered password seller is trying to update is the last 5 (or less) passwords. If it is, return.
                for (let i = 0; i < seller.oldPasswords.length; i ++) {
                    const comparePasswords = await bcrypt.compare(req.body.password, seller.oldPasswords[i])

                    if (comparePasswords) {
                        return res.status(200).json({msg: "Your password cannot be your last 5 passwords."})
                    }
                }

                // If the entered password is not the same as the last 5 (or less) passwords (seller can make the same password as long as it is not the most recent 5 passwords), then:

                // Hash and salt new password
                const newPassword = await bcrypt.hash(req.body.password, 10)

                // Initialize variable that will store the updated seller
                let updateSeller 
                
                if (await seller.oldPasswords.length == 5) {
                    // Remove the oldest password aka 1st password in the oldPasswords array
                    updateSeller = await SellerUser.findOneAndUpdate({_id: req.user._id}, {password: newPassword, $pop: {oldPasswords: -1}, }, {new:true})
                    // Then add the newly updated password to the oldPasswords array
                    updateSeller = await SellerUser.findOneAndUpdate({_id: req.user._id}, {$push: {oldPasswords: newPassword}}, {new:true})

                    /* Could have also updated password by doing: 
                    const updateSeller = await SellerUser.findOneAndUpdate({_id: req.user.id}, {password: newPassword}, {new:true})
                    await updateSeller.oldPasswords.shift()
                    await updateSeller.oldPasswords.push(updateSeller.password)
                     updateSeller.save() */

                } else if (await seller.oldPasswords.length < 5) {
                    // Do not need to remove from oldPasswords array since the length of the array is not 5 yet
                    updateSeller = await SellerUser.findOneAndUpdate({_id: req.user._id}, {password: newPassword, $push: {oldPasswords: newPassword}}, {new:true})

                    /* Could have also updated password by doing: 
                    const updateSeller = await SellerUser.findOneAndUpdate({_id: req.user.id}, {password: newPassword}, {new:true})
                    updateSeller.oldPasswords.push(updateSeller.password)
                    updateSeller.save() */
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
            await SellerUser.findById(req.user.id, function(err, seller) { // after finding the seller document by id, the document is passed to the seller param of the callback function 
                
                console.log(seller, "seller from deleting seller")
                console.log(seller.electronicItems, "seller.electronicItems")

                // ???? WILL UPDATE THIS COMMENT
                const queryElectronicItems = Electronic.find({_id: {$in: seller.electronicItems}})

                // Delete reviews of the electronic items by running the pre deleteMany hook in electronic schema
                queryElectronicItems.deleteMany()

                // Runs the pre deleteOne hook in seller schema. Then deletes the seller and its electronic items
                seller.deleteOne()
                res.status(200).json({success: true})
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