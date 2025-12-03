const Item = require('../models/Item');

exports.getItems = async (req, res) => {
    try {
        const items = await Item.find();
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createItem = async (req, res) => {
    try {
        const newItem = new Item(req.body);
        const savedItem = await newItem.save();
        res.json(savedItem);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// update items
exports.updateItem = async (req, res) => {
    try {
        const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedItem);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// delete items
exports.deleteItem = async (req, res) => {
    try {
        await Item.findByIdAndDelete(req.params.id);
        res.json({ message: 'Item deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.searchItems = async (req, res) => {
    try {
        const { q } = req.query;
        const items = await Item.find({
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { category: { $regex: q, $options: 'i' } }
            ]
        });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// --- Idagdag ito para sa GET /:id ---
exports.getItemById = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- Idagdag ito para sa PATCH /:id ---
exports.partialUpdateItem = async (req, res) => {
    try {
        // FindByIdAndUpdate will apply only the fields present in req.body
        const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, { 
            new: true, // Ibalik ang updated na document
            runValidators: true // Tiyakin na gumagana ang Mongoose validators
        });
        
        if (!updatedItem) {
            return res.status(404).json({ message: 'Item not found' });
        }
        
        res.json(updatedItem);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};