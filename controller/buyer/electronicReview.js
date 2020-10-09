const mongoose = require('mongoose')
const Electronic = require('../../model/seller/electronic')
const ElectronicReview = require('../../model/buyer/reviewElectronic')

// SHOW ALL REVIEWS OF ONE ELECTRONIC ITEM
const index = async (req, res) => {
    try {
        const {limit=1, page=1} = req.query

        const electronic = await Electronic.findById(req.params.id)
        const electronicReviews = await ElectronicReview.find({ElectronicItem:electronic._id}).limit(limit*1).skip((page-1)*limit)
        const total = await electronicReviews.length

        res.status(200).json({
            electronicReviews,
            totalPages: Math.ceil(total/limit),
            currentPage: page
        })
    }
    catch (error) {
        res.status(400).send(error);
    }
}

// CREATE ELECTRONIC ITEM REVIEW 

// Click on Review button, which has an attribute id equal to the electronic item ObjectId
// Click on Submit of Review button, which will generate an ObjectId of that review

const create = async (req,res) => {
    try {
        const electronicReview = await ElectronicReview.create(req.body) // From the frontend, the req.body will have the id of the electronic item. The item's id is grabbed when we click on the review button under each electronic item since each review button has an attribute id equal to the electronic item ObjectId
        const matchedElectronic = await Electronic.findById(electronicReview.ElectronicItem[0]) // Find the electronic item the review is for using the ObjectId of the electronic item stored in model reviewElectronic document's ElectronicItem key
        await matchedElectronic.Review.push(electronicReview._id) // store id of the review for the electronic item in model electronic document's Review key
        await matchedElectronic.save()
        res.status(200).json(electronicReview);
    } 
    catch (error) {
        res.status(400).send(error);
    }
}

// UPDATE ONE ELECTRONIC ITEM REVIEW 
const update = async (req, res) => {
    try {
        reviewElectronicUpdate = await ElectronicReview.findByIdAndUpdate(req.params.id, req.body, {new: true});
        res.status(200).json(reviewElectronicUpdate);
    }
    catch (error) {
        res.status(400).send(error)
    }
}

// DELETE ONE ELECTRONIC ITEM REVIEW 
const destroy = async (req, res) => {
    try {
        deleteElectronicReview = await ElectronicReview.findByIdAndDelete(req.params.id);
        res.status(200).send("Successfully deleted review")
    } 
    catch (error) {
        res.status(400).send(error)
    }
}

module.exports = {index, create, update, destroy}