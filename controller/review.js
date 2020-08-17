const mongoose = require('mongoose')
const Electronic = require('../model/electronics')
const Review = require('../model/reviewElectronic')
const reviewElectronic = require('../model/reviewElectronic')

// Click on Review button, which has an attribute id equal to the item ObjectId
// Click on Submit of Review button, which will generate an ObjectId of that review

// CREATE ELECTRONIC ITEM
const create = async (req,res) => {
    try {
        const electronicReview = await Review.create(req.body)
        const matchedElectronic = await Electronic.findById(electronicReview.ElectronicItem)
        await matchedElectronic.Review.push(electronicReview._id)
        await matchedElectronic.save()
        res.status(200).json(electronicReview);
    } 
    catch (error) {
        res.status(400).send(error);
    }
}

const update = async (req, res) => {
    try {
        reviewElectronicUpdate = await Review.findByIdAndUpdate(req.params.id, req.body, {new: true});
        res.status(200).json(reviewElectronicUpdate);
    }
    catch (error) {
        res.status(400).send(error)
    }
}

module.exports = {create, update}