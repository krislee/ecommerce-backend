const mongoose = require('mongoose')
const Electronic = require('../model/electronics')
const Review = require('../model/review')

// Click on Review button, which has an attribute id equal to the item ObjectId
// Click on Submit of Review button, which will generate an ObjectId of that review

// CREATE ELECTRONIC ITEM
const create = async (req,res) => {
    try {
        const electronicReview = await Review.create(req.body)
        const matchedElectronic = Electronic.findById(electronicReview.ElectronicItem)
        matchedElectronic.Review = electronicReview._id
        res.status(200).json(electronicReview);
    } 
    catch (error) {
        res.status(400).send(error);
    }
}

