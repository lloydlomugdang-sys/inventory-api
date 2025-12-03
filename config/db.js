// config/db.js
const mongoose = require("mongoose");

let isConnected = false; // global connection state

const connectDB = async () => {
  if (isConnected) {
    // Reuse existing connection
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    isConnected = conn.connections[0].readyState === 1;

    console.log("MongoDB Connected Successfully!");
  } catch (err) {
    console.error("MongoDB Connection Error:", err.message);
  }
};

module.exports = connectDB;
