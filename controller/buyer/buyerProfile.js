const Buyer = require('../../model/buyer/buyerUser')
const {ElectronicReview} = require('../../model/buyer/reviewElectronic')

// GETTING BUYER PROFILE
const index = async (req, res) => {
    try {
        if (req.user.buyer){
            const buyerProfile = await Buyer.findOne({_id: req.user._id})

            const BuyerReviews = await ElectronicReview.find({Buyer: buyerProfile._id})

            res.status(200).json({
                id: buyerProfile._id,
                username: buyerProfile.username,
                email: buyerProfile.email,
                reviews: BuyerReviews
            });
        } else {
            res.status(400).json({msg: "You are not authorized to view this profile."})
        }
    }
    catch (error) {
        res.status(400).send(error);
    }
}

// UPDATING BUYER PROFILE
const update = async (req, res) => {
    try {
        if (req.user.buyer){
            const updateBuyer = await Buyer.findOneAndUpdate({_id: req.user.id}, req.body, {new: true}) // {new:true} to return the document after updating
            if (updateBuyer){
                res.status(200).json({
                    id: updateBuyer._id,
                    username: updateBuyer.username,
                    email: updateBuyer.email
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

// DELETING BUYER PROFILE 
const destroy = async (req, res) => {
    try {
        if (req.user.buyer){
            await Buyer.findById(req.user.id, function(err, buyer) {
                // buyer.deleteOne()
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