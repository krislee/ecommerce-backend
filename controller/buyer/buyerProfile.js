const Buyer = require('../../model/seller/sellerUser')
const {ElectronicReview} = require('../buyer/electronicReview')

// GETTING SELLER PROFILE
const index = async (req, res) => {
    try {
        if (req.user.seller){
            const sellerProfile = await Buyer.findOne({_id: req.user._id})
            const reviews = ElectronicReview.find({Buyer: sellerProfile._id})
            res.status(200).json({
                id: sellerProfile._id,
                username: sellerProfile.username,
                email: sellerProfile.email,
                reviews: reviews
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
            const updateSeller = await Buyer.findOneAndUpdate({_id: req.user.id}, req.body, {new: true}) // {new:true} to return the document after updating
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

// DELETING SELLER PROFILE AND ITS ELECTRONICS
const destroy = async (req, res) => {
    try {
        if (req.user.seller){
            await Buyer.findById(req.user.id, function(err, seller) {
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