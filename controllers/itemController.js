const Item = require('../models/Item');

// Get all items
exports.getItems = async (req, res) => {
    try {
        const items = await Item.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            count: items.length,
            data: items
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
};

// Create new item
exports.createItem = async (req, res) => {
    try {
        // Ensure quantity field is mapped (if client sends 'qty' instead of 'quantity')
        const itemData = { ...req.body };
        if (itemData.qty !== undefined) {
            itemData.quantity = itemData.qty;
            delete itemData.qty;
        }
        
        const newItem = new Item(itemData);
        const savedItem = await newItem.save();
        
        res.status(201).json({
            success: true,
            message: 'Item created successfully',
            data: savedItem
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
};

// Get item by ID
exports.getItemById = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ 
                success: false,
                message: 'Item not found' 
            });
        }
        res.json({
            success: true,
            data: item
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
};

// Update item (PUT)
exports.updateItem = async (req, res) => {
    try {
        // Handle field name mapping
        const updateData = { ...req.body };
        if (updateData.qty !== undefined) {
            updateData.quantity = updateData.qty;
            delete updateData.qty;
        }
        
        const updatedItem = await Item.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            { 
                new: true,
                runValidators: true 
            }
        );
        
        if (!updatedItem) {
            return res.status(404).json({ 
                success: false,
                message: 'Item not found' 
            });
        }
        
        res.json({
            success: true,
            message: 'Item updated successfully',
            data: updatedItem
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
};

// Partial update (PATCH)
exports.partialUpdateItem = async (req, res) => {
    try {
        // Handle field name mapping
        const updateData = { ...req.body };
        if (updateData.qty !== undefined) {
            updateData.quantity = updateData.qty;
            delete updateData.qty;
        }
        
        const updatedItem = await Item.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            { 
                new: true,
                runValidators: true 
            }
        );
        
        if (!updatedItem) {
            return res.status(404).json({ 
                success: false,
                message: 'Item not found' 
            });
        }
        
        res.json({
            success: true,
            message: 'Item partially updated successfully',
            data: updatedItem
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
};

// Delete item
exports.deleteItem = async (req, res) => {
    try {
        const deletedItem = await Item.findByIdAndDelete(req.params.id);
        
        if (!deletedItem) {
            return res.status(404).json({ 
                success: false,
                message: 'Item not found' 
            });
        }
        
        res.json({
            success: true,
            message: 'Item deleted successfully'
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
};

// Search items
exports.searchItems = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.trim() === '') {
            return res.status(400).json({ 
                success: false,
                message: 'Search query is required' 
            });
        }
        
        const items = await Item.find({
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { category: { $regex: q, $options: 'i' } }
            ]
        }).sort({ createdAt: -1 });
        
        res.json({
            success: true,
            count: items.length,
            data: items
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
};