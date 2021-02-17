const {Electronic} = require('../../model/seller/electronic')
const {ElectronicReview} = require('../../model/buyer/reviewElectronic')
const Buyer = require('../../model/buyer/buyerUser')
const Order = require('../../model/order')
// SHOW ALL REVIEWS OF ONE ELECTRONIC ITEM

const index = async (req, res) => {
    try {
        if (req.user.buyer){
            const {limit=2, page=1} = req.query // set default values to limit and page for pagination

            // find all the reviews of one electronic item by getting the id of electronic item
            // .limit(limit*1).skip((page-1)*limit) limits 10 reviews per page for pagination
            const allElectronicReviews = await ElectronicReview.find({Buyer: req.user._id}).limit(limit*1).skip((page-1)*limit)

            const total = await allElectronicReviews.length

            return res.status(200).json({
                allReviews: allElectronicReviews,
                totalPages: Math.ceil(total/limit),
                currentPage: page
            })
        } else {
            return res.status(400).json({msg: "You are not authorized to view the reviews"})
        }
    }
    catch (error) {
        return res.status(400).send(error);
    }
}

// CREATE ELECTRONIC ITEM REVIEW 

// Click on Review button, which has an attribute id equal to the electronic item ObjectId
// Click on Submit of Review button, which will generate an ObjectId of that review

const create = async (req,res) => {
    try {
        if (req.user.buyer){ // user needs to be logged in to review, hence req.user.buyer
            // Check if logged in reviewer actually brought the electronic item before buyer can review
            // To do this, get all the orders that belongs to the logged in user using the param: {LoggedInBuyer: req.user._id} & then if find any of those orders have that item based on the id of the item {'Items.ItemId': req.params.electronicId}}. req.params will have the id of the electronic item. The item's id is grabbed when we click on the review button under each electronic item since each review button has an attribute id equal to the electronic item ObjectId.
            const purchasedOrders = await Order.find({LoggedInBuyer: req.user._id, 'Items.ItemId': req.params.electronicId})
            console.log(43, purchasedOrders)
 
            if(purchasedOrders.length > 0) {
                console.log(49, purchasedOrders.length)
                // If user did purchased the item that he/she wants to review, check if user already made a review before creating a new review
                const review = await ElectronicReview.findOne({Buyer: req.user._id, ElectronicItem: req.params.electronicId})
                if(review) {
                    console.log(50, review)
                    return res.status(200).json({secondReviewMessage: "You have already made a review for this item."})
                } else {
                    console.log(53)
                    const electronicReview = await ElectronicReview.create({
                        Name: req.user.username,
                        Comment: req.body.Comment,
                        Rating: req.body.Rating,
                        Buyer: req.user._id,
                        ElectronicItem: req.params.electronicId
                    }) 
                    console.log(56, electronicReview)
                    return res.status(200).json(electronicReview);
                }
                
            } else {
                return res.status(200).json({unverifiedReviewMessage: 'You can not review an item you have not purchased.'})
            }
        } else {
            return res.status(400).json({msg: "You are not authorized to create the review"})
        }
    } 
    catch (error) {
        console.log(67, error)
        return res.status(400).json({msg: error});
    }
}

// UPDATE ONE ELECTRONIC ITEM REVIEW 
const update = async (req, res) => {
    try {
        if (req.user.buyer){
            const reviewElectronicUpdate = await ElectronicReview.findOneAndUpdate({_id: req.params.id, Buyer: req.user._id}, req.body, {new: true});
            if (reviewElectronicUpdate) {
                return res.status(200).json(reviewElectronicUpdate)
            } 
        } else {
            return res.status(400).json({msg: "You are not authorized to update the review"})
        }
    }
    catch (error) {
        return res.status(400).send(error)
    }
}

// DELETE ONE ELECTRONIC ITEM REVIEW 
const destroy = async (req, res) => {
    try {
        if (req.user.buyer){
            const deleteElectronicReview = await ElectronicReview.findOneAndDelete({_id: req.params.id, Buyer: req.user._id});
            if(deleteElectronicReview) {
                return res.status(200).json(deleteElectronicReview)
            }
        } else {
            return res.status(400).json({msg: "You are not authorized to delete the review"})
        }
    } 
    catch (error) {
        return res.status(400).send(error)
    }
}

module.exports = {index, create, update, destroy}