const Electronic = require('../../model/seller/electronic')
const ElectronicReview = require('../../model/buyer/reviewElectronic')

// SHOW ALL REVIEWS OF ONE ELECTRONIC ITEM
const index = async (req, res) => {
    try {
        if (req.user.buyer){
            const {limit=10, page=1} = req.query // set default values to limit and page for pagination

            // find all the reviews of one electronic item by getting the id of electronic item
            // .limit(limit*1).skip((page-1)*limit) limits 10 reviews per page for pagination
            const allElectronicReviews = await ElectronicReview.find({ElectronicItem:req.params.electronicId, Buyer: req.user._id}).limit(limit*1).skip((page-1)*limit)

            const total = await allElectronicReviews.length

            res.status(200).json({
                allElectronicReviews,
                totalPages: Math.ceil(total/limit),
                currentPage: page
            })
        } else {
            res.status(400).json({msg: "You are not authorized to view the reviews"})
        }
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
        console.log(req.user)
        if (req.user.buyer){
            // From the frontend, the req.body will have the id of the electronic item. The item's id is grabbed when we click on the review button under each electronic item since each review button has an attribute id equal to the electronic item ObjectId
            const electronicReview = await ElectronicReview.create({
                Name: req.user.username,
                Comment: req.body.Comment,
                Rating: req.body.Rating,
                Buyer: req.user._id
            }) 
            
            // Find the electronic item the review is for using the ObjectId of the electronic item stored in model reviewElectronic document's ElectronicItem key
            const matchedElectronic = await Electronic.findById(electronicReview.ElectronicItem[0]) 
        
            // store id of the review for the electronic item in model electronic document's Review key
            await matchedElectronic.Review.push(electronicReview._id) 
    
            await matchedElectronic.save()
            res.status(200).json(electronicReview);
        } else {
            res.status(400).json({msg: "You are not authorized to create the review"})
        }
    } 
    catch (error) {
        res.status(400).json({msg: error});
    }
}

// UPDATE ONE ELECTRONIC ITEM REVIEW 
const update = async (req, res) => {
    try {
        if (req.user.buyer){
            const reviewElectronicUpdate = await ElectronicReview.findOneAndUpdate({_id: req.params.id, Buyer: req.user._id}, req.body, {new: true});
            if (reviewElectronicUpdate) {
                res.status(200).json(reviewElectronicUpdate)
            } 
        } else {
            res.status(400).json({msg: "You are not authorized to update the review"})
        }
    }
    catch (error) {
        res.status(400).send(error)
    }
}

// DELETE ONE ELECTRONIC ITEM REVIEW 
const destroy = async (req, res) => {
    try {
        if (req.user.buyer){
            const deleteElectronicReview = await ElectronicReview.findOneAndDelete({_id: req.params.id, Buyer: req.user._id});
            if(deleteElectronicReview) {
                res.status(200).json(deleteElectronicReview)
            }
        } else {
            res.status(400).json({msg: "You are not authorized to delete the review"})
        }
    } 
    catch (error) {
        res.status(400).send(error)
    }
}

module.exports = {index, create, update, destroy}