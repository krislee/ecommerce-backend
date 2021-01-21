const LoggedInUser = require('../../model/buyer/buyerUser')

const addUserShipping = async(req, res) => {
    const {line1, line2, city, state, postalCode, country} = req.body
    if (req.user) {
      const loggedInUser = await LoggedInUser.findById(req.user._id)
      const addShippingAddress = await loggedInUser.address.push(`${line1}, ${line2}, ${city}, ${state}, ${postalCode}, ${country}`)

      console.log("add shipping address", addShippingAddress)

      res.status(200).json({
        address: loggedInUser.address[loggedInUser.address.length - 1], // should include sending over the ids of each address - check!
      })
    }
  }
  
// Each edit button has the id of the shipping address object, so find that particular address for the user and update that address
const updateUserShipping = async(req, res) => {
const {line1, line2, city, state, postalCode, country} = req.body
    if(req.user) {
        const loggedInUser = await LoggedInUser.findById(req.user._id)
        const updateShippingAddress = await loggedInUser.findOneAndUpdate({_id: req.params.id}, {address: `${line1}, ${line2}, ${city}, ${state}, ${postalCode}, ${country}`}, {new: true})

        console.log("update shipping address", updateShippingAddress)

        res.status(200).json({
            address: loggedInUser.address,
        })
    }
}

const updateDefaultShipping = async(req, res) => {
    if(req.user) {
        const loggedInUser = await LoggedInUser.findById(req.user._id)
        const updateShippingAddress = await loggedInUser.findOneAndUpdate({_id: req.params.id}, {default: true}, {new: true})
        console.log("update default shipping address", updateShippingAddress)

        res.status(200).json({
            address: loggedInUser.address
        })
    }
}

// Choose the 1st shipping address made if customer.shipping is null
const indexUserShipping = async(req, res) => {
    if(req.user) {
        const loggedInUser = await LoggedInUser.findById(req.user._id)
        res.status(200).json({
            address: loggedInUser.address,
        })
    }
}

const showUserShipping = async(req, res) => {
    if(req.user) {
        const loggedInUser = await LoggedInUser.findById(req.user._id)
    }
}

module.exports = {addUserShipping, updateUserShipping, indexUserShipping, showUserShipping}