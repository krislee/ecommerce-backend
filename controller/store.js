const {Electronic} = require('../model/seller/electronic')
const {SellerUser} = require('../model/seller/sellerUser')
const {ElectronicReview} = require('../model/buyer/reviewElectronic')

// Buyer will see all the electronic items made by all sellers
const electronicIndex = async (req, res) => {
    try {
        const {limit = 2, page = 1} = req.query // set default values to limit and page for pagination
        const total = await Electronic.find().countDocuments() // count the number of electronic items docs made by all sellers 

        const allElectronic = await Electronic.find().limit(limit*1).skip((page-1) * limit)

        return res.status(200).json({
            allElectronic,
            totalPages: Math.ceil(total/limit),
            currentPage: page //page is received from req.query
        });
    }
    catch (error) {
        return res.status(400).send(error);
    }
}

const electronicShow = async(req, res) => {
    try {
        console.log(26, req.params.id)
        // Find the electronic item by its id which will be found in the routes params. Do not need to find an electronic item that is for a specific seller since buyer can view all electronic items from all sellers
        const oneElectronic = await  Electronic.findById(req.params.id)
        const ownPageElectronic = await Electronic.find({_id: req.params.id, "Description.OwnPage": true}).populate("Description")
        console.log(30, "OWN ELECTRONIC", ownPageElectronic)

        // Get seller's document to send back general information about the seller for the item (i.e. username, email for contact)
        const seller = await SellerUser.findById(oneElectronic.Seller[0])

        // Get all the reviews documents of that one electronic item
        const electronicReview = await ElectronicReview.find({ElectronicItem: oneElectronic._id}).sort({ _id: -1 })
        
        // Get the item ratings to average it out
        const electronicReviewRatings = await ElectronicReview.find({ElectronicItem: oneElectronic._id}).select({ "Rating": 1, "_id": 0});
        console.log(37, electronicReviewRatings)
        const total = electronicReviewRatings.reduce((total, rating) => {
            console.log(39,rating)
            return total + rating['Rating']
        }, 0)
        console.log(42, total)
        const avgRating = total/electronicReviewRatings.length

        return res.status(200).json({
            electronicItem: oneElectronic,
            ownPage: ownPageElectronic,
            sellerInfo: {username: seller.username, email: seller.email},
            review: electronicReview,
            avgRating: avgRating
        })

    }
    catch (error) {
        return res.status(400).send(error);
    }
}

module.exports = {electronicIndex, electronicShow}