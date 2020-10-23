const SellerUser = require('../../model/seller/sellerUser')

// GETTING SELLER PROFILE
const index = async (req, res) => {
    try {
        if (req.user.seller){
            const sellerProfile = await SellerUser.findOne({_id: req.user._id})
            res.status(200).json({
                id: sellerProfile._id,
                username: sellerProfile.username,
                email: sellerProfile.email
            });
        } else {
            res.status(400).json({msg: "You are not authorized to view this profile."})
        }
    }
    catch (error) {
        res.status(400).send(error);
    }
}

// UPDATING USER PROFILE
const update = async (req, res) => {
    try {
        if (req.user.seller){
            const updateSeller = await Seller.findOneAndUpdate({_id: req.user.id}, req.body, {new: true}) // {new:true} to return the document after updating
            if (updateSeller){
                res.status(200).json({
                    id: updateSeller._id,
                    username: updateSeller.username,
                    email: updateSeller.email
                });
            } 
        } else {
            res.status(400).json({msg: "You are not authorized to update this profile."})
        }
    }
    catch (error) {
        res.status(400).send(error);
    }
}

// DELETING ONE OF THE ELECTRONICS
const destroy = async (req, res) => {
    try {
        if (req.user.seller){
            const deleteSeller = await SellerUser.findOneAndDelete({_id: req.user.id})
            res.status(200).json("deleted")
        } else {
            res.status(400).json({msg: "You are not authorized to delete this profile."})
        }
    }
    catch (error) {
        res.status(400).send(error);
    }
}

module.exports = {index, update, destroy}