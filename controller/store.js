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
        // const oneElectronic = await Electronic.findOne({_id: req.params.id}).elemMatch("Description",{"OwnPage": true})
        // const oneElectronic = await Electronic.findOne({_id: req.params.id, 'Description': {$elemMatch: {OwnPage: true}}})
        // const secondElectronic = await Electronic.find({_id: req.params.id}, {Description: {$elemMatch: {'OwnPage': 'true'}}}) // returns only the first match doc

        const electronic = await Electronic.findOne({_id: req.params.id}).select({'Description': 1, 'Seller': 1})
        console.log(33, electronic)
        const tryElectronic = await Electronic.aggregate([
            { $unwind: '$Description' },
            { $match: { 'Description.OwnPage': true, _id: mongoose.Types.ObjectId(req.params.id) }},
            { $project: { Heading: '$Description.Heading', Paragraph: '$Description.Paragraph', Image: '$Description.Image', OwnPage: '$Description.OwnPage' }}
        ])
        console.log(35, tryElectronic)
        // Get seller's document to send back general information about the seller for the item (i.e. username, email for contact)
        const seller = await SellerUser.findById(electronic.Seller[0])

        // Get all the reviews documents of that one electronic item
        const electronicReview = await ElectronicReview.find({ElectronicItem: electronic._id}).sort({ _id: -1 })
        console.log(43, electronicReview)
        // Get the item ratings to average it out
        const electronicReviewRatings = await ElectronicReview.find({ElectronicItem: electronic._id}).select({ "Rating": 1, "_id": 0});
        console.log(46, electronicReviewRatings)
        const total = electronicReviewRatings.reduce((total, rating) => {
            console.log(39,rating)
            return total + rating['Rating']
        }, 0)
        console.log(51, total)
        const avgRating = total/electronicReviewRatings.length

        return res.status(200).json({
            electronicItem: electronic,
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