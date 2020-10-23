const Electronic = require('../../model/seller/electronic')
const SellerUser = require('../../model/seller/sellerUser')

// GETTING ALL ELECTRONIC ITEMS
// Credit: https://medium.com/javascript-in-plain-english/simple-pagination-with-node-js-mongoose-and-express-4942af479ab2
const index = async (req, res) => {
    try {
        if (req.user.seller){
            const {limit = 10, page = 1} = req.query // set default values to limit and page for pagination
            const total = await Electronic.find({Seller: req.user._id}).countDocuments() // find the electronic items that belong to the logged in seller (loggedIn seller's info resides in req.user), and then count the number of electronic items docs returned

            // .find({Seller:req.user._id}) finds all electronic item documents that belong to the logged in seller
            // .limit(limit*1).skip((page-1) * limit) paginates up to the limit
            // .populate(model_key_name) used in order to have the documents from referenced model, reviewElectronic to populate each Electronic document
            const allElectronic = await Electronic.find({Seller: req.user._id}).limit(limit*1).skip((page-1) * limit).populate('Review'); 
            
            res.status(200).json({
                allElectronic,
                totalPages: Math.ceil(total/limit),
                currentPage: page //page is received from req.query
            });
        } else {
            const {limit = 10, page = 1} = req.query // set default values to limit and page for pagination
            const total = await Electronic.find().countDocuments() // count the number of electronic items docs returned

            // .find() finds all electronic items
            // .limit(limit*1).skip((page-1) * limit) paginates up to the limit
            // .populate(model_key_name) used in order to have the documents from referenced model, reviewElectronic to populate each Electronic document
            const allElectronic = await Electronic.find().limit(limit*1).skip((page-1) * limit).populate('Review'); 
            
            res.status(200).json({
                allElectronic,
                totalPages: Math.ceil(total/limit),
                currentPage: page //page is received from req.query
            });
        }
    }
    catch (error) {
        res.status(400).send(error);
    }
}

// GET ONE ELECTRONIC ITEM (INCLUDING ALL REVIEWS OF ONLY ONE ELECTRONIC ITEM)
const show = async (req, res) => {
    try {
        if (req.user.seller){
            // Find one electronic item that belongs to the logged in seller. The query, _id: req.params.id will only get one electronic item with that id and the query, Seller: req.user_id will only get the one electronic item of the logged in user
            const oneElectronic = await Electronic.findOne({_id: req.params.id, Seller: req.user._id}).populate('Review'); 
            if (oneElectronic) {
                res.status(200).json(oneElectronic)
            } 
        } else {
            res.status(400).json({msg: "You are not authorized to view the electronic item"})
        }
    } catch (error) {
        res.status(400).send(error);
    }
}

// Click on Review button, which has an attribute id equal to the item ObjectId
// Click on Submit of Review button, which will generate an ObjectId of that review

// CREATE ELECTRONIC ITEM
const create = async (req, res) => {
    try {
        if (req.user.seller){
        // We cannot just do Electronic.create(req.body) because we needed to create using req.user for Seller key as well, so the create method will take in an object.
            const electronic = await Electronic.create({
                Name: req.body.Name,
                Brand: req.body.Brand,
                Image: req.body.Image,
                Description: req.body.Description,
                Price: req.body.Price,
                Seller: req.user
            })
            const user = await SellerUser.findById(req.user._id)
            await user.electronicItems.push(electronic._id)
            await user.save()
            res.status(200).json(electronic);
        } else {
            res.status(400).json({msg: "You are not authorized to create an electronic item"})
        }
    } 
    catch (error) {
        console.log("error")
        res.status(400).send(error);
    }
}

// UPDATING ONE OF THE ELECTRONICS
const update = async (req, res) => {
    try {
        if (req.user.seller){
            const updateElectronic = await Electronic.findOneAndUpdate({_id: req.params.id, Seller: req.user._id}, req.body, {new: true}).populate('Review'); // {new:true} to return the document after updating
            if (updateElectronic){
                res.status(200).json(updateElectronic)
            } 
        } else {
            res.status(400).json({msg: "You are not authorized to update the electronic item"})
        }
    }
    catch (error) {
        res.status(400).send(error);
    }
}

// DELETING ONE OF THE ELECTRONICS
const destroy = async (req, res) => {
    try {
        if (req.user.seller){
            const deleteElectronic = await Electronic.findOneAndDelete({_id: req.params.id, Seller: req.user._id})
            if (deleteElectronic){
                seller = await SellerUser.findOne({_id: req.user._id})
                await seller.electronicItems.splice(indexOf(deleteElectronic._id), 1)
                res.status(200).json(deleteElectronic)
            } 
        } else {
            res.status(400).json({msg: "You are not authorized to delete the electronic item"})
        }
    } catch (error) {
        res.status(400).send(error)
    }
}

module.exports = {index, show, create, update, destroy}