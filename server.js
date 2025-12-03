// server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet'); // New: Para sa Security
const swaggerUI = require('swagger-ui-express'); // New: Para sa Documentation
const swaggerJsDoc = require('swagger-jsdoc'); // New: Para sa Documentation

require('dotenv').config();

const app = express();

// ===================================
// SECURITY & BASIC MIDDLEWARES
// ===================================

// Requirement #7: Helmet for Security Headers
app.use(helmet()); 

// Basic Express Middlewares
app.use(express.json()); // Body Parser
app.use(cors()); // Requirement #7: CORS Enabled

// ===================================
// SWAGGER (OPENAPI) DOCUMENTATION SETUP
// ===================================

// Configuration para sa swagger-jsdoc
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Inventory API Documentation', 
            version: '1.0.0',
            description: 'Inventory Management API documentation, built with Express, Mongoose, and MongoDB.',
        },
        servers: [
            {
                url: '/api/items', 
                description: 'Inventory API Routes'
            },
        ],
        // Dito ilalagay ang inyong Mongoose/Item Schema definitions (Requirement #5)
        components: {
            schemas: {
                ItemInput: {
                    type: 'object',
                    required: ['name', 'quantity', 'price'],
                    properties: {
                        name: { type: 'string', example: 'HDMI Cable' },
                        quantity: { type: 'number', example: 150 },
                        price: { type: 'number', example: 350.50 },
                        category: { type: 'string', example: 'Electronics' },
                    }
                },
                Item: {
                    allOf: [
                        { $ref: '#/components/schemas/ItemInput' },
                        {
                            type: 'object',
                            properties: {
                                _id: { type: 'string', description: 'Unique identifier' },
                                createdAt: { type: 'string', format: 'date-time' },
                                updatedAt: { type: 'string', format: 'date-time' },
                            }
                        }
                    ]
                }
            }
        }
    },
    // Tukuyin kung aling files ang babasahin ng swagger-jsdoc para sa JSDoc comments
    apis: ['./routes/*.js'], 
};

const swaggerSpecs = swaggerJsDoc(swaggerOptions);

// Requirement #5: Swagger UI accessible at /api-docs
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpecs));


// ===================================
// ROUTES & ERROR HANDLING
// ===================================

const itemRoutes = require('./routes/items');

// Connection to DB (from config/db.js)
require('./config/db')();

// Routes
app.use('/api/items', itemRoutes);

// Generic Error Handler (Requirement #7: Handle errors gracefully)
// Ito ang huling middleware na tatawagin.
app.use((err, req, res, next) => {
    console.error(err.stack);

    // Default status code at message
    const status = err.status || 500;
    const message = err.message || 'Something went wrong on the server.';
    
    // I-return ang error as JSON
    res.status(status).json({
        success: false,
        message: message,
    });
});


// ===================================
// SERVER START
// ===================================

// Use PORT from .env or default 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));