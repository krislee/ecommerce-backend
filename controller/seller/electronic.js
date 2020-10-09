const mongoose = require('mongoose')
const Electronic = require('../../model/seller/electronic')


// Click on Review button, which has an attribute id equal to the item ObjectId
// Click on Submit of Review button, which will generate an ObjectId of that review

// CREATE ELECTRONIC ITEM
const create = async (req,res) => {
    try {
        const electronic = await Electronic.create(req.body)
        res.status(200).json(electronic);
    } 
    catch (error) {
        res.status(400).send(error);
    }
}

// GETTING ALL ELECTRONIC ITEMS
// Credit: https://medium.com/javascript-in-plain-english/simple-pagination-with-node-js-mongoose-and-express-4942af479ab2
const index = async (req, res) => {
    try {
        const {limit = 1, page = 1} = req.query // set default values to limit and page
        const total = await Electronic.countDocuments() // get total documents in electronic model

        // .find({}) finds all documents
        // .limit(limit*1).skip((page-1) * limit) paginates up to the limit
        // .populate(model_key_name) used in order to have the documents from referenced model, reviewElectronic to populate each Electronic document
        const allElectronic = await Electronic.find({}).limit(limit*1).skip((page-1) * limit).populate('Review'); 
        
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

// GET ONE ELECTRONIC ITEM
const show = async (req, res) => {
    try {
        const oneElectronic = await Electronic.findById(req.params.id).populate('Review');
        res.status(200).json(oneElectronic);
    } catch (error) {
        res.status(400).send(error);
    }
}

// GET ALL REVIEWS OF ONE ELECTRONIC ITEM 
// const show = async (req, res) => {
//     try {
//         const {limit = 1, page = 1} = req.query // set default values to limit and page
//         const total = await Electronic.countDocuments() // get total documents in electronic model
//         const oneElectronic = await Electronic.findById(req.params.id).populate('Review');
//         res.status(200).json(oneElectronic);
//     } catch (error) {
//         res.status(400).send(error);
//     }
// }

// UPDATING ONE OF THE ELECTRONICS
const update = async (req, res) => {
    try {
        const updateElectronic = await Electronic.findByIdAndUpdate(req.params.id, req.body, {new: true}).populate('Review'); // {new:true} to return the document after updating
        res.status(200).json(updateElectronic);
    }
    catch (error) {
        res.status(400).send(error);
    }
}

// DELETING ONE OF THE ELECTRONICS
const destroy = async (req, res) => {
    try {
        const deleteElectronic = await Electronic.findByIdAndDelete(req.params.id)
        res.json(200).send("Delete successfully")
    } catch (error) {
        res.status(400).send(error)
    }
}

module.exports = {create, index, show, update, destroy}