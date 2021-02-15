const {Electronic} = require('../model/seller/electronic')
const {SellerUser} = require('../model/seller/sellerUser')
const {ElectronicReview} = require('../model/buyer/reviewElectronic')

// Buyer will see all the electronic items made by all sellers
const electronicIndex = async (req, res) => {
    try {
        const {limit = 2, page = 1} = req.query // set default values to limit and page for pagination
        const total = await Electronic.find().countDocuments() // count the number of electronic items docs made by all sellers 

        const allElectronic = await Electronic.find().limit(limit*1).skip((page-1) * limit)

        res.status(200).json({
            allElectronic,
            totalPages: Math.ceil(total/limit),
            currentPage: page //page is received from req.query
        });
    }
    catch (error) {
        res.status(400).send(error);
    }
}

const electronicShow = async(req, res) => {
    try {
         // Find the electronic item by its id which will be found in the routes params. Do not need to find an electronic item that is for a specific seller since buyer can view all electronic items from all sellers
         const oneElectronic = await  Electronic.findById(req.params.id)

         // Get seller's document to send back general information about the seller for the item (i.e. username, email for contact)
         const seller = await SellerUser.findById(oneElectronic.Seller[0])

         // Get all the reviews documents of that one electronic item
         const electronicReview = await ElectronicReview.find({ElectronicItem: oneElectronic._id})
        //  console.log(electronicReview, "all electronic reviews")

         res.status(200).json({
             electronicItem: oneElectronic,
             sellerInfo: {username: seller.username, email: seller.email},
             review: electronicReview
         })

    }
    catch (error) {
        res.status(400).send(error);
    }
}

module.exports = {electronicIndex, electronicShow}