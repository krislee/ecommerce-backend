const Health = require('../../model/seller/health')

// GETTING ALL HEALTH ITEMS
// Credit: https://medium.com/javascript-in-plain-english/simple-pagination-with-node-js-mongoose-and-express-4942af479ab2
const index = async (req, res) => {
    try {
        const {limit = 10, page = 1} = req.query // set default values to limit and page for pagination
        const total = await Health.countDocuments() // get total documents in health model

        // .find({}) finds all documents
        // .limit(limit*1).skip((page-1) * limit) paginates up to the limit
        // .populate(model_key_name) used in order to have the documents from referenced model, reviewHealth to populate each Health document
        const allHealth = await Health.find({}).limit(limit*1).skip((page-1) * limit).populate('Review'); 
        
        res.status(200).json({
            allHealth,
            totalPages: Math.ceil(total/limit),
            currentPage: page //page is received from req.query
        });
    }
    catch (error) {
        res.status(400).send(error);
    }
}

// GET ONE HEALTH ITEM (INCLUDING ALL REVIEWS OF ONLY ONE HEALTH ITEM)
const show = async (req, res) => {
    try {
        const oneHealth = await Health.findById(req.params.id).populate('Review'); 
        res.status(200).json(oneHealth);
    } catch (error) {
        res.status(400).send(error);
    }
}

// Click on Review button, which has an attribute id equal to the item ObjectId
// Click on Submit of Review button, which will generate an ObjectId of that review

// CREATE HEALTH ITEM
const create = async (req,res) => {
    try {
        const health = await Health.create(req.body)
        res.status(200).json(health);
    } 
    catch (error) {
        res.status(400).send(error);
    }
}

// UPDATING ONE OF THE HEALTH
const update = async (req, res) => {
    try {
        const updateHealth = await Health.findByIdAndUpdate(req.params.id, req.body, {new: true}).populate('Review'); // {new:true} to return the document after updating
        res.status(200).json(updateHealth);
    }
    catch (error) {
        res.status(400).send(error);
    }
}

// DELETING ONE OF THE HEALTH
const destroy = async (req, res) => {
    try {
        const deleteHealth = await Health.findByIdAndDelete(req.params.id)
        res.json(200).send("Delete successfully")
    } catch (error) {
        res.status(400).send(error)
    }
}

module.exports = {index, show, create, update, destroy}