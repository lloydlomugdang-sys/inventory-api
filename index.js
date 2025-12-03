// index.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet'); 
const swaggerUI = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

require('dotenv').config();

const app = express();

// ===================================
// SECURITY & MIDDLEWARES
// ===================================

// FIX: Allow CDN for Swagger UI
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "script-src": ["'self'", "https://cdn.jsdelivr.net"],
        "style-src": ["'self'", "https://cdn.jsdelivr.net"],
        "img-src": ["'self'", "data:", "https://cdn.jsdelivr.net"],
      },
    },
  })
);

app.use(express.json());
app.use(cors());

// Redirect root → Swagger docs
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// ===================================
// SWAGGER DOCS SETUP
// ===================================

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Inventory API Documentation',
      version: '1.0.0',
      description: 'Inventory Management API using Node, Express, MongoDB',
    },
    servers: [
      {
        url: '/', // FIXED — should not be /api-docs/
        description: 'Production server'
      }
    ],
    components: {
      schemas: {
        ItemInput: {
          type: 'object',
          required: ['name', 'quantity', 'price'],
          properties: {
            name: { type: 'string', example: 'HDMI Cable' },
            quantity: { type: 'number', example: 150 },
            price: { type: 'number', example: 350.5 },
            category: { type: 'string', example: 'Electronics' },
          },
        },
        Item: {
          allOf: [
            { $ref: '#/components/schemas/ItemInput' },
            {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
          ],
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

const swaggerSpecs = swaggerJsDoc(swaggerOptions);

// FIX: Use CDN for Swagger UI files (no MIME errors)
app.use(
  '/api-docs',
  swaggerUI.serve,
  swaggerUI.setup(swaggerSpecs, {
    customCssUrl:
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui.css',
    customJs: [
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui-bundle.js',
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui-standalone-preset.js',
    ],
  })
);

// ===================================
// ROUTES
// ===================================

const itemRoutes = require('./routes/items');
require('./config/db')();

app.use('/api/items', itemRoutes);

// ===================================
// ERROR HANDLER
// ===================================

app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ===================================
// SERVER (Local only)
// ===================================

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
