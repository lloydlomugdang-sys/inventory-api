const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    quantity: { 
        type: Number,
        required: [true, 'Quantity is required'],
        min: [0, 'Quantity cannot be negative']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    category: {
        type: String,
        default: 'Uncategorized'
    }
}, {
    timestamps: true,  // Add createdAt and updatedAt
    versionKey: false
});

module.exports = mongoose.model('Item', ItemSchema);