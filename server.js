const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const itemRoutes = require('./routes/items');

// Connect to DB
require('./config/db')();

// Routes
app.use('/api/items', itemRoutes);

// Use PORT from .env or default 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

