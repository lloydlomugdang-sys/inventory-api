const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUI = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

require('dotenv').config();

const app = express();

// ====================
// SIMPLE CORS - ALLOW EVERYTHING
// ====================
app.use(helmet({
  contentSecurityPolicy: false, // DISABLE FOR SWAGGER
}));

app.use(cors()); // ALLOW ALL ORIGINS
app.use(express.json());

// ====================
// DATABASE CONNECTION
// ====================
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined');
}

// Connection options
const atlasOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
};

const connectDB = async () => {
  try {
    if (!MONGODB_URI) {
      console.log('⚠️ No MONGODB_URI, skipping connection');
      return;
    }
    
    await mongoose.connect(MONGODB_URI, atlasOptions);
    console.log('✅ MongoDB Connected');
    
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    
    if (process.env.VERCEL) {
      console.log('⚠️ Vercel: Continuing without database');
    }
  }
};

connectDB();

// ====================
// SIMPLE SWAGGER (NO SCHEMAS)
// ====================
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Inventory API',
      version: '1.0.0',
      description: 'Inventory Management System API',
    },
    servers: [
      {
        url: 'https://inventory-jnc9d2p3n-john-lloyds-projects-3baf7b6d.vercel.app',
        description: 'Production Server'
      },
      {
        url: 'http://localhost:5000',
        description: 'Development Server'
      }
    ],
  },
  apis: ['./routes/*.js'],
};

const swaggerSpecs = swaggerJsDoc(swaggerOptions);

// Simple Swagger UI setup
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    tryItOutEnabled: true,
  }
}));

// ====================
// ROUTES
// ====================
const itemRoutes = require('./routes/items');
app.use('/api/items', itemRoutes);

// ====================
// BASIC ENDPOINTS
// ====================
app.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusText = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbStatus] || 'unknown';
  
  res.json({
    success: true,
    message: 'Inventory API is running! 🚀',
    database: statusText,
    endpoints: {
      docs: '/api-docs',
      items: '/api/items',
      health: '/health'
    }
  });
});

app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const isHealthy = dbStatus === 1;
  
  res.json({
    success: isHealthy,
    status: isHealthy ? 'healthy' : 'unhealthy',
    database: dbStatus === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// ====================
// ERROR HANDLING
// ====================
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    available: ['/', '/health', '/api-docs', '/api/items']
  });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error'
  });
});

// ====================
// VERCEL EXPORT
// ====================
module.exports = app;