const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
    name: String,
    qty: Number,
    category: String,
    price: Number
}, {
    versionKey: false
});


module.exports = mongoose.model('Item', ItemSchema);

