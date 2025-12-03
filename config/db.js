// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log('MongoDB Connected successfully!');
    } catch (err) {
        
        console.error('MongoDB connection error:', err.message); 
        
    }
};

module.exports = connectDB;