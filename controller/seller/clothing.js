const Clothing = require('../../model/seller/clothing')

// GETTING ALL CLOTHING ITEMS
// Credit: https://medium.com/javascript-in-plain-english/simple-pagination-with-node-js-mongoose-and-express-4942af479ab2
const index = async (req, res) => {
    try {
        const {limit = 10, page = 1} = req.query // set default values to limit and page for pagination
        const total = await Clothing.countDocuments() // get total documents in clothing model

        // .find({}) finds all documents
        // .limit(limit*1).skip((page-1) * limit) paginates up to the limit
        // .populate(model_key_name) used in order to have the documents from referenced model, reviewClothing to populate each Clothing document
        const allClothing = await Clothing.find({}).limit(limit*1).skip((page-1) * limit).populate('Review'); 
        
        res.status(200).json({
            allClothing,
            totalPages: Math.ceil(total/limit),
            currentPage: page //page is received from req.query
        });
    }
    catch (error) {
        res.status(400).send(error);
    }
}

// GET ONE CLOTHING ITEM (INCLUDING ALL REVIEWS OF ONLY ONE CLOTHING ITEM)
const show = async (req, res) => {
    try {
        const oneClothing = await Clothing.findById(req.params.id).populate('Review'); 
        res.status(200).json(oneClothing);
    } catch (error) {
        res.status(400).send(error);
    }
}

// Click on Review button, which has an attribute id equal to the item ObjectId
// Click on Submit of Review button, which will generate an ObjectId of that review

// CREATE CLOTHING ITEM
const create = async (req,res) => {
    try {
        const clothing = await Clothing.create(req.body)
        res.status(200).json(clothing);
    } 
    catch (error) {
        res.status(400).send(error);
    }
}

// UPDATING ONE OF THE CLOTHING
const update = async (req, res) => {
    try {
        const updateClothing = await Clothing.findByIdAndUpdate(req.params.id, req.body, {new: true}).populate('Review'); // {new:true} to return the document after updating
        res.status(200).json(updateClothing);
    }
    catch (error) {
        res.status(400).send(error);
    }
}

// DELETING ONE OF THE CLOTHING
const destroy = async (req, res) => {
    try {
        const deleteClothing = await Clothing.findByIdAndDelete(req.params.id)
        res.json(200).send("Delete successfully")
    } catch (error) {
        res.status(400).send(error)
    }
}

module.exports = {index, show, create, update, destroy}