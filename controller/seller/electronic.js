const {Electronic} = require('../../model/seller/electronic')
const {ElectronicReview} = require('../../model/buyer/reviewElectronic')

// GETTING ALL ELECTRONIC ITEMS
// Credit: https://medium.com/javascript-in-plain-english/simple-pagination-with-node-js-mongoose-and-express-4942af479ab2
const index = async (req, res) => {
    try {
        // Seller only sees the electronic items made by him/herself
        if (req.user.seller){
            const {limit = 10, page = 1} = req.query // set default values to limit and page for pagination
            const total = await Electronic.find({Seller: req.user._id}).countDocuments() // find the electronic items that belong to the logged in seller (loggedIn seller's info resides in req.user), and then count the number of electronic items docs returned

            // .find({Seller:req.user._id}) finds all electronic item documents that belong to the logged in seller
            // .limit(limit*1).skip((page-1) * limit) paginates up to the limit 
                // .limit(limit*1) limits how many documents per page (limit * 1) converts limit from req.query to a number if limit is provided in the req.query
                // .skip((page-1) * limit) skips the previous number of documents from previous pages to show the current page's documents (i.e. There are 3 pages, each with a limit of showing 5 docs. Then to have the 3rd page show 11-15 items, server needs to skip 10 documents) 
            const allElectronic = await Electronic.find({Seller: req.user._id}).limit(limit*1).skip((page-1) * limit)

            return res.status(200).json({
                allElectronic,
                totalPages: Math.ceil(total/limit),
                currentPage: page //page is received from req.query i.e. route would be localhost:3000/seller/electronic?page=2, and the page number is 2
            });
        } 
    }
    catch (error) {
        return res.status(400).send(error);
    }
}

// GET ONE ELECTRONIC ITEM (INCLUDING ALL REVIEWS OF ONLY ONE ELECTRONIC ITEM)
const show = async (req, res) => {
    try {
        if (req.user.seller){

            // Find one electronic item that belongs to the logged in seller. The query, _id: req.params.id, will only get one electronic item with that id and the query, Seller: req.user_id, will only get the one electronic item of the logged in user
            const oneElectronic = await Electronic.findOne({_id: req.params.id, Seller: req.user._id})

            // If the electronic item document cannot be found because the database does not contain a document with the combination of the item's id and seller's id, then return message
            if (!oneElectronic) return res.status(400).json({msg: "Electronic is not found"})

            // Find all the electronic reviews for the one electronic item
            const electronicReview = await ElectronicReview.find({ElectronicItem: oneElectronic._id})
           
            if (oneElectronic) {
                return res.status(200).json({
                    electronicItem: oneElectronic,
                    review: electronicReview
                })
            } 
        }
    } catch (error) {
        return res.status(400).send(error);
    }
}

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
                Seller: req.user._id
            })
            return res.status(200).json(electronic);
        } else {
            return res.status(400).json({msg: "You are not authorized to create an electronic item"})
        }
    } 
    catch (error) {
        return res.status(400).send(error);
    }
}

// UPDATING ONE OF THE ELECTRONICS
const update = async (req, res) => {
    try {
        if (req.user.seller){
            const updateElectronic = await Electronic.findOneAndUpdate({_id: req.params.id, Seller: req.user._id}, req.body, {new: true}) // {new:true} to return the document after updating
            if (updateElectronic){
                return res.status(200).json(updateElectronic)
            } 
        } else {
            return res.status(400).json({msg: "You are not authorized to update the electronic item"})
        }
    }
    catch (error) {
        return res.status(400).send(error);
    }
}

// DELETING ONE OF THE ELECTRONICS
const destroy = async (req, res) => {
    try {
        if (req.user.seller){
            // Find the electronic document and pass it to the callback function's electronic param
            await Electronic.findById({_id: req.params.id, Seller: req.user._id}, function(err, electronic) {

                // Run the deleteOne pre hook in electronic model to delete all reviews of the electronic item when deleted. Then deleteOne method will be called when next() in the pre hook is run.
                electronic.deleteOne()

                return res.status(200).json({success: true})
            })
        } else {
            return res.status(400).json({msg: "You are not authorized to delete the electronic item"})
        }
    } catch (error) {
        return res.status(400).send(error)
    }
}

// PUBLISH ELECTRONICS TO STORE 

module.exports = {index, show, create, update, destroy}

// needs a publish function where after seller creates/updates the item, publish to the store site --> make a publishedElectronic model and index that