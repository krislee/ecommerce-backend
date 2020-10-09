const Clothing = require('../../model/seller/clothing')
const ClothingReview = require('../../model/buyer/reviewClothing')

// SHOW ALL REVIEWS OF ONE CLOTHING ITEM
const index = async (req, res) => {
    try {
        const {limit=10, page=1} = req.query // set default values to limit and page for pagination

        // find all the reviews of one clothing item by getting the id of clothing item
        // .limit(limit*1).skip((page-1)*limit) limits 10 reviews per page for pagination
        const clothingReviews = await ClothingReview.find({ClothingItem:req.params.clothingId}).limit(limit*1).skip((page-1)*limit)

        const total = await clothingReviews.length

        res.status(200).json({
            clothingReviews,
            totalPages: Math.ceil(total/limit),
            currentPage: page
        })
    }
    catch (error) {
        res.status(400).send(error);
    }
}

// CREATE CLOTHING ITEM REVIEW 

// Click on Review button, which has an attribute id equal to the clothing item ObjectId
// Click on Submit of Review button, which will generate an ObjectId of that review

const create = async (req,res) => {
    try {
        // From the frontend, the req.body will have the id of the clothing item. The item's id is grabbed when we click on the review button under each clothing item since each review button has an attribute id equal to the clothing item ObjectId
        const clothingReview = await ClothingReview.create(req.body) 

        // Find the clothing item the review is for using the ObjectId of the clothing item stored in model reviewClothing document's ClothingItem key
        const matchedClothing = await Clothing.findById(clothingReview.ClothingItem[0]) 

        // store id of the review for the clothing item in model clothing document's Review key
        await matchedClothing.Review.push(clothingReview._id) 
        
        await matchedClothing.save()
        res.status(200).json(clothingReview);
    } 
    catch (error) {
        res.status(400).send(error);
    }
}

// UPDATE ONE CLOTHING ITEM REVIEW 
const update = async (req, res) => {
    try {
        const reviewClothingUpdate = await ClothingReview.findByIdAndUpdate(req.params.id, req.body, {new: true});
        res.status(200).json(reviewClothingUpdate);
    }
    catch (error) {
        res.status(400).send(error)
    }
}

// DELETE ONE CLOTHING ITEM REVIEW 
const destroy = async (req, res) => {
    try {
        const deleteClothingReview = await ClothingReview.findByIdAndDelete(req.params.id);
        res.status(200).send("Successfully deleted review")
    } 
    catch (error) {
        res.status(400).send(error)
    }
}

module.exports = {index, create, update, destroy}