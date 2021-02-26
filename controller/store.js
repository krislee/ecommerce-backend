const {Electronic} = require('../model/seller/electronic')
const {SellerUser} = require('../model/seller/sellerUser')
const {ElectronicReview} = require('../model/buyer/reviewElectronic')
const mongoose = require('mongoose')

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
        // const secondElectronic = await Electronic.find({_id: req.params.id}, {Description: {$elemMatch: {'OwnPage': 'true'}}}) // returns only the first match doc
        /* const tryElectronic = await Electronic.aggregate([
            { $unwind: '$Description' },
            { $match: { 'Description.OwnPage': true }},
            { $project: { Heading: '$Description.Heading', Paragraph: '$Description.Paragraph', Image: '$Description.Image', OwnPage: '$Description.OwnPage' }},    
        ]) */ // gives all the Description.OwnPage docs - not one query and its matching subdocs

        // const ownPageDescriptions = await Electronic.aggregate([
        //     { $match: {_id: new mongoose.Types.ObjectId(req.params.id)} },
        //     { $unwind: '$Description' },
        //     { $match: { 'Description.OwnPage': true }},
        //     { $project: { Heading: '$Description.Heading', Paragraph: '$Description.Paragraph', Image: '$Description.Image', OwnPage: '$Description.OwnPage' }}
        // ]) // this works!!!

        // Find the electronic item by its id which will be found in the routes params. 
        const electronic = await Electronic.findOne({_id: req.params.id}).select({'Description': 1, 'Seller': 1})
        console.log(43, electronic)
        // Get seller's document to send back general information about the seller for the item (i.e. username, email for contact)
        const seller = await SellerUser.find(electronic.Seller[0])

        // Get all the reviews documents of that one electronic item
        const electronicReview = await ElectronicReview.find({ElectronicItem: electronic._id}).sort({ _id: -1 })

        // Get the item ratings to average it out
        const electronicReviewRatings = await ElectronicReview.find({ElectronicItem: electronic._id}).select({ "Rating": 1, "_id": 0});
        const total = electronicReviewRatings.reduce((total, rating) => {
            return total + rating['Rating']
        }, 0)
        const avgRating = total/electronicReviewRatings.length

        // Separate ownPage and nonOwnPage electronic Descriptions
        const ownPageElectronic = []
        const nonOwnPageElectronic = []

        for(let i=0; i < electronic.length; i++) {
            if(electronic.Description[i].OwnPage) {
                ownPageElectronic.push(electronic.Description[i])
            } else {
                nonOwnPageElectronic.push(electronic.Description[i])
            }
        }

        return res.status(200).json({
            // electronicItem: electronic,
            ownPageElectronic: ownPageElectronic,
            notOwnPageElectronic: nonOwnPageElectronic,
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