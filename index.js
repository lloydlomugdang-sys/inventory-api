const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUI = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

require('dotenv').config();

const app = express();

// ====================
// SECURITY MIDDLEWARE
// ====================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https://cdn.jsdelivr.net"]
    }
  }
}));
app.use(cors());
app.use(express.json());

// ====================
// DATABASE CONNECTION
// ====================
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
}

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
  }
};

// Connect immediately for Vercel
connectDB();

// ====================
// SWAGGER DOCS
// ====================
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Inventory API',
      version: '1.0.0',
      description: 'Inventory Management System API with 7 endpoints',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: '/', // For Vercel - will use current domain
        description: 'Production server'
      }
    ],
  },
  apis: ['./routes/*.js'],
};

const swaggerSpecs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpecs));

// ====================
// ROUTES
// ====================
const itemRoutes = require('./routes/items');
app.use('/api/items', itemRoutes);

// ====================
// BASIC ENDPOINTS
// ====================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Inventory API is running on Vercel! 🚀',
    endpoints: {
      documentation: '/api-docs',
      items_api: '/api/items',
      health_check: '/health'
    },
    deployed_on: 'Vercel',
    status: 'operational'
  });
});

app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusCodes = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({
    success: dbStatus === 1,
    status: dbStatus === 1 ? 'healthy' : 'unhealthy',
    database: statusCodes[dbStatus] || 'unknown',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ====================
// ERROR HANDLING
// ====================
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    available_endpoints: [
      'GET /',
      'GET /health',
      'GET /api-docs',
      'GET /api/items',
      'POST /api/items',
      'GET /api/items/:id',
      'PUT /api/items/:id',
      'PATCH /api/items/:id',
      'DELETE /api/items/:id',
      'GET /api/items/search?q='
    ]
  });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

// ====================
// VERCEL SERVERLESS EXPORT
// ====================
// This is crucial for Vercel
module.exports = app;