const Address = require('../../model/buyer/shippingAddress')

// A new shipping address is created if logged in user clicks 'Add new address' in ShippingAddress component or click 'Save address' in checkout.
const addShipping = async(req, res) => {
    try {
        if(req.user.buyer) {
            let newAddress
            // Check if client's default shipping address box is checked when creating the address
            if (!req.body.default) { // default is not checked
                newAddress = await Address.create({
                    Address: req.body.address,
                    Buyer: req.user._id
                })
            } else { // default is checked
                newAddress = await Address.create({
                    Address: req.body.address,
                    DefaultAddress: true,
                    Buyer: req.user._id
                })
            }

            // If the address is created during checkout, then update the LastUsed property.
            if(req.query.lastUsed) {
                const lastUsedAddress = await Address.findOneAndUpdate({_id: newAddress._id}, {LastUsed: true}, {new: true})
            }

            console.log(26, newAddress)

            res.status(200).json({address: newAddress})
        } else {
            res.status(400).json({msg: "You are not authorized to add shipping address"})
        }
    }
    catch (error) {
        res.status(400).json({msg: error});
    }
  }

// Each edit button has the id of the shipping address document
// Update shipping address
const updateShipping = async(req, res) => {
    if(req.user.buyer) {

        const buyerAddress = await Address.findOneAndUpdate({Buyer:req.user._id, _id: req.params.id}, {Address: req.params.address}, {new: true})
        
        console.log(45, "update shipping address", buyerAddress)

        res.status(200).json({
            address: buyerAddress
        })
    } else {
        res.status(400).json({msg: "You are not authorized to update shipping address"})
    }
}

// Default address button for existing shipping address has the id of the shipping address document. Default address button for adding shipping address does not have the id.
// Update default shipping address. The function will only run if default button is checked.
const updateDefaultShipping = async(req, res) => {
    // First, check if there is already a default shipping stored
    // If there is, then update that address document's DefaultAddress to false, then update the selected address to have DefaultAddress to true
    // If there is not default, then update the selected address to have DefaultAddress to false
    try {
        if(req.user.buyer) {
            const defaultShipping = await Address.find({DefaultAddress: true})

            console.log(65, "defaultShipping: ", defaultShipping)

            if (defaultShipping) {
                const changeDefaultAddressToFalse = await Address.findOneAndUpdate({_id: defaultShipping._id, Buyer: req.user._id}, {DefaultAddress: false}, {new: true})
                
                console.log(70, "updated default to false:", changeDefaultAddressToFalse)
            }

            const newDefaultAddress = await Address.findOneAndUpdate({_id: req.params.id}, {DefaultAddress: false}, {new: true})

            console.log(75, "new default address: ", newDefaultAddress)

            // res.status(200).json({address: newDefaultAddress})
            indexShipping()
        } else {
            res.status(400).json({msg: "You are not authorized to update default shipping address"})
        }
    } catch(error) {
        res.status(400).json({msg: error});
    }
}

// Get all addresses associated with the logged in buyer (for shipping address component)
const indexShipping = async(req, res) => {
    try {
        if(req.user.buyer) {
            //  Find all the addresses that belongs to the buyer
            const buyerAddresses = await Address.find({Buyer:req.user._id})

            console.log("all addresses: ", buyerAddresses)
            
            res.status(200).json({
                address: buyerAddresses
            })
        } else {
            res.status(400).json({msg: "You are not authorized to view buyer's shipping address"})
        }
    } catch(error) {
        res.status(400).json({msg: error});
    }
}

//  Get all addresses except for the address displayed during checkout when Saved Addresses button is clicked. Saved address button will have the id of the displayed address document.
const savedShipping = async(req, res) => {
    try {
        if(req.user.buyer) {
            const savedAddresses = await Address.find({ _id: {$ne: req.params.id}, Buyer: req.user._id})

            console.log("all addresses: ", buyerAddresses)
            
            res.status(200).json({
                address: savedAddresses
            })
        } else {
            res.status(400).json({msg: "You are not authorized to view buyer's saved addresses"})
        }
    } catch(error) {
        res.status(400).json({msg: error});
    }
}

// Get either the default or last used, saved shipping address. If there are neither of the previous ones, send back null so that a shipping form will be made.
const checkoutShipping = async(req, res) => {
    try {
        if(req.user.buyer) {
            const defaultAddress = await Address.find({DefaultAddress: true, Buyer: req.user._id})

            console.log("defaultShipping: ", defaultShipping)
            
            const lastUsedSavedAddress = await Address.find({LastUsed: true, Buyer: req.user._id})

            console.log("last used address: ", lastUsedSavedAddress)

            if(defaultAddress) {
                res.status(200).json({
                    address: defaultAddress 
                })
            } else if (lastUsedAddress) {
                res.status(200).json({
                    address: defaultAddress 
                })
            } else if(firstCreatedAddress) {
                res.status(200).json({
                    address: firstCreatedAddress
                })
            } else {
                res.status(200).json({
                    address: null
                })
            }
            
        } else {
            res.status(400).json({msg: "You are not authorized to view buyer's last used address"})
        }
    } catch(error) {
        res.status(400).json({msg: error});
    }
}

// Delete shipping address
const deleteShipping = async(req, res) => {
    try {
        if(req.user.buyer) {
            const deleteAddress = await Address.findOneAndDelete({_id: req.params.id, Buyer: req.user._id})

            console.log("deleted address: ", deleteAddress)

            // res.status(200).json({
            //     address: deleteAddress
            // })
            indexShipping()
        } else {
            res.status(400).json({msg: "You are not authorized to delete buyer's address"})
        }
    } catch(error) {
        res.status(400).json({msg: error});
    }
}

module.exports = {addShipping, updateShipping, updateDefaultShipping, indexShipping, savedShipping, checkoutShipping, deleteShipping}