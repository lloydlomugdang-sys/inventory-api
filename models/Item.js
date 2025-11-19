const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    qty: { type: Number, required: true },
    category: { type: String },
    price: { type: Number }
});


module.exports = mongoose.model('Item', itemSchema);
