const {BuyerShippingAddress}= require('../../model/buyer/shippingAddress')

// A new shipping address is created if logged in user clicks 'Add new address' in Shipping Address component or 'Save address for future' is checked in checkout (but for checkout this function won't actually run until Confirm Card Payment is clicked)
// ?lastUsed=false when running addShipping() from Shipping Address component, ?lastUsed=true when running addShipping() from checkout + first time saving the shipping
// ?default=false if default is not checked. ?default=true if default is checked. 
// Combinations from Shipping Address component: ?lastUsed=false&default=false, ?lastUsed=false&default=true
// Possible combinations from checkout:?lastUsed=true&default=false, ?lastUsed=false&default=true
const addShipping = async(req, res) => {
    try {
        if(req.user.buyer) {
            let newAddress
            // Check if client's default shipping address box is checked when creating the address
            if (req.query.default === 'true') { // default is checked

                // Check if there is already a default address. If there is one, set it back to false for the DefaultAddress property
                const previousDefaultAddress = await BuyerShippingAddress.findOne({DefaultAddress: true, Buyer: req.user._id})

                if(previousDefaultAddress){
                    previousDefaultAddress.DefaultAddress = false
                    previousDefaultAddress.save()
                }

                if(req.query.lastUsed === 'true') {
                    // Check if there is a previous last used shipping addresses. If there is a last used shipping address, then update it to false.
                    const previousLastUsedAddress = await BuyerShippingAddress.findOne({LastUsed: true, Buyer: req.user._id})

                    if(previousLastUsedAddress){
                        previousLastUsedAddress.LastUsed = false
                        previousLastUsedAddress.save()
                    }

                    newAddress = await BuyerShippingAddress.create({
                        Address: req.body.address,
                        DefaultAddress: true,
                        Buyer: req.user._id,
                        LastUsed: true,
                        Name: req.body.name
                    })
                } else {
                    newAddress = await BuyerShippingAddress.create({
                        Address: req.body.address,
                        DefaultAddress: true,
                        Buyer: req.user._id,
                        Name: req.body.name,
                    })
                }
            } else { // default is not checked
                if(req.query.lastUsed === 'true') {  // If the address is created during checkout, then also include the LastUsed property.
                    // Check if there is a previous last used shipping addresses. If there is a last used shipping address, then update it to false.
                    const previousLastUsedAddress = await BuyerShippingAddress.findOne({LastUsed: true, Buyer: req.user._id})

                    previousLastUsedAddress.LastUsed = false
                    previousLastUsedAddress.save()

                    newAddress = await BuyerShippingAddress.create({
                        Address: req.body.address,
                        Buyer: req.user._id, 
                        LastUsed: true,
                        Name: req.body.name,
                    })
                } else {
                    newAddress = await BuyerShippingAddress.create({
                        Address: req.body.address,
                        Buyer: req.user._id,
                        Name: req.body.name,
                    })
                }
            }

            if (req.query.lastUsed === 'true'){
                res.status(200).json({address: newAddress})
            } else {
                indexShipping(req, res)
            }    
        } else {
            res.status(400).json({msg: "You are not authorized to add shipping address"})
        }
    }
    catch (error) {
        res.status(400).json({msg: error});
    }
  }

// Each edit button has the id of the shipping address document
// Update shipping address in Shipping Address component or at checkout.
const updateShipping = async(req, res) => {
    try {
        if(req.user.buyer) {
            const buyerAddress = await BuyerShippingAddress.findOneAndUpdate({Buyer:req.user._id, _id: req.params.id}, {Address: req.body.address, Name: req.body.name}, {new: true})

            indexShipping(req, res)
        } else {
            res.status(400).json({msg: "You are not authorized to update shipping address"})
        }
    } catch(error) {
            res.status(400).json({msg: error});
    }
}

// Update existing shipping address to be default or remove default property from existing shipping address. The function will only run if default button is clicked and checked.
// Default address button for existing shipping address has the id of the shipping address document.
const changeDefaultShipping = async(req, res) => {
    try {
        if(req.user.buyer) {
            // If default box is checked, then add default property
            if(req.query.default === "true") {

                // First, check if there is already a default shipping stored. If there is, then update that address document's DefaultAddress to false
                const defaultShipping = await BuyerShippingAddress.findOne({DefaultAddress: true, Buyer: req.user._id})

                if (defaultShipping) {
                    defaultShipping.DefaultAddress = false
                    defaultShipping.save() 
                }

                // Update the selected address to have DefaultAddress to true
                const newDefaultAddress = await BuyerShippingAddress.findOneAndUpdate({_id: req.params.id, Buyer: req.user._id}, {DefaultAddress: true}, {new: true})

                // Send back all addresses
                indexShipping(req, res)
            } else {
                // If checked default box is clicked unchecked, this part of the function is triggered
                const removeDefaultAddress = await BuyerShippingAddress.findOneAndUpdate({_id: req.params.id, Buyer: req.user._id}, {DefaultAddress: false}, {new: true})

                // Send back all addresses
                indexShipping(req, res)
            } 
        } else {
            res.status(400).json({msg: "You are not authorized to update default shipping address"})
        }
    } catch(error) {
        res.status(400).json({msg: error});
    }
}

// Update Last Used Shipping
const updateLastUsedShipping = async(req, res) => {		
    try {		
        if (req.user.buyer) {		
            // Check if there is already a last used shipping address, and remove it
            const previousLastUsedAddress = await BuyerShippingAddress.findOne({LastUsed: true, Buyer: req.user._id})
            if(previousLastUsedAddress) {

                previousLastUsedAddress.LastUsed = false
                previousLastUsedAddress.save()
            }

            // Add the lastUsed property to the address last used to checkout
            const lastUsedAddress = await BuyerShippingAddress.findOneAndUpdate({_id: req.params.id, Buyer: req.user._id}, {LastUsed: true}, {new: true})			

            res.status(200).json({address: lastUsedAddress})		
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
            const buyerAddresses = await BuyerShippingAddress.find({Buyer:req.user._id})
            
            res.status(200).json(buyerAddresses)
        } else {
            res.status(400).json({msg: "You are not authorized to view buyer's shipping address"})
        }
    } catch(error) {
        res.status(400).json({msg: error});
    }
}

// When an address is selected from the Saved Shipping button at checkout and will be displayed at checkout.
const showShipping = async(req, res) => {
    try {
        if(req.user.buyer) {
            //  Find all the addresses that belongs to the buyer
            const buyerAddress = await BuyerShippingAddress.findById(req.params.id)
            
            res.status(200).json({
                address: buyerAddress
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
            const savedAddresses = await BuyerShippingAddress.find({ _id: {$ne: req.params.id}, Buyer: req.user._id})
            
            res.status(200).json(savedAddresses)
        } else {
            res.status(400).json({msg: "You are not authorized to view buyer's saved addresses"})
        }
    } catch(error) {
        res.status(400).json({msg: error});
    }
}

// Get either the default or last used, saved shipping address. If there are neither of the previous ones, then get the last shipping address the user created but has not set as default nor used yet. If all three does not apply, then send back null so that a shipping form will be made.
const checkoutShipping = async(req, res) => {
    try {
        if(req.user.buyer) {
            const defaultAddress = await BuyerShippingAddress.findOne({DefaultAddress: true, Buyer: req.user._id})
            
            const lastUsedSavedAddress = await BuyerShippingAddress.findOne({LastUsed: true, Buyer: req.user._id})

            const allAddresses = await BuyerShippingAddress.find({Buyer: req.user._id})

            if(defaultAddress) {
                res.status(200).json({address: defaultAddress})
            } else if (lastUsedSavedAddress) {
                res.status(200).json({address: lastUsedSavedAddress})
            } else if(allAddresses.length > 0) {
                const lastCreatedAddress = allAddresses[allAddresses.length-1]
                res.status(200).json({address: lastCreatedAddress})
            } else {
                res.status(200).json({address: null})
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
            const deleteAddress = await BuyerShippingAddress.findOneAndDelete({_id: req.params.id, Buyer: req.user._id})

            indexShipping(req, res)
        } else {
            res.status(400).json({msg: "You are not authorized to delete buyer's address"})
        }
    } catch(error) {
        res.status(400).json({msg: error});
    }
}

module.exports = {addShipping, updateShipping, updateLastUsedShipping, changeDefaultShipping, indexShipping, showShipping, savedShipping, checkoutShipping, deleteShipping}