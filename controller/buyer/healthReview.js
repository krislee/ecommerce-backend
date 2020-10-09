const Health = require('../../model/seller/health')
const HealthReview = require('../../model/buyer/reviewHealth')

// SHOW ALL REVIEWS OF ONE HEALTH ITEM
const index = async (req, res) => {
    try {
        const {limit=10, page=1} = req.query // set default values to limit and page for pagination

        // find all the reviews of one health item by getting the id of health item
        // .limit(limit*1).skip((page-1)*limit) limits 10 reviews per page for pagination
        const healthReviews = await HealthReview.find({HealthItem:req.params.healthId}).limit(limit*1).skip((page-1)*limit)

        const total = await healthReviews.length

        res.status(200).json({
            healthReviews,
            totalPages: Math.ceil(total/limit),
            currentPage: page
        })
    }
    catch (error) {
        res.status(400).send(error);
    }
}

// CREATE HEALTH ITEM REVIEW 

// Click on Review button, which has an attribute id equal to the health item ObjectId
// Click on Submit of Review button, which will generate an ObjectId of that review

const create = async (req,res) => {
    try {
        // From the frontend, the req.body will have the id of the health item. The item's id is grabbed when we click on the review button under each health item since each review button has an attribute id equal to the health item ObjectId
        const healthReview = await HealthReview.create(req.body) 

        // Find the health item the review is for using the ObjectId of the health item stored in model reviewHealth document's HealthItem key
        const matchedHealth = await Health.findById(healthReview.HealthItem[0]) 

        // store id of the review for the health item in model health document's Review key
        await matchedHealth.Review.push(healthReview._id) 
        
        await matchedHealth.save()
        res.status(200).json(healthReview);
    } 
    catch (error) {
        res.status(400).send(error);
    }
}

// UPDATE ONE HEALTH ITEM REVIEW 
const update = async (req, res) => {
    try {
        const reviewHealthUpdate = await HealthReview.findByIdAndUpdate(req.params.id, req.body, {new: true});
        res.status(200).json(reviewHealthUpdate);
    }
    catch (error) {
        res.status(400).send(error)
    }
}

// DELETE ONE HEALTH ITEM REVIEW 
const destroy = async (req, res) => {
    try {
        const deleteHealthReview = await HealthReview.findByIdAndDelete(req.params.id);
        res.status(200).send("Successfully deleted review")
    } 
    catch (error) {
        res.status(400).send(error)
    }
}

module.exports = {index, create, update, destroy}