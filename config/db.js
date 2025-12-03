const mongoose = require('mongoose');

// connection to MongoDB atlas
module.exports = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected!');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
