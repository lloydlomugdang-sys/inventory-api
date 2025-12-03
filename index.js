const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUI = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

require('dotenv').config();

const app = express();

// ====================
// TEMPORARY: Disable helmet CSP for Swagger
// ====================
app.use(helmet({
  contentSecurityPolicy: false, // DISABLE TEMPORARILY FOR SWAGGER
}));

// ====================
// SIMPLE CORS FIX - ALLOW EVERYTHING
// ====================
app.use(cors()); // Allow ALL origins

// Add custom headers for extra safety
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json());

// ====================
// DATABASE CONNECTION - FIXED FOR VERCEL + ATLAS
// ====================
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
  console.error('💡 Add to Vercel: Settings → Environment Variables');
  console.error('💡 Format: mongodb+srv://username:password@cluster.mongodb.net/database');
  
  // Don't exit in Vercel production
  if (process.env.VERCEL) {
    console.log('⚠️ Running without MongoDB connection');
  }
}

// MONGODB ATLAS CONNECTION OPTIONS
const atlasOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // 30 seconds timeout
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  maxPoolSize: 5,
  retryWrites: true,
  w: 'majority'
};

const connectDB = async () => {
  try {
    if (!MONGODB_URI) {
      console.log('⚠️ No MONGODB_URI, skipping connection');
      return;
    }
    
    console.log('🔗 Connecting to MongoDB Atlas...');
    console.log('📝 URI:', MONGODB_URI.replace(/\/\/(.*):(.*)@/, '//***:***@'));
    
    await mongoose.connect(MONGODB_URI, atlasOptions);
    
    console.log('✅ MongoDB Atlas Connected Successfully!');
    console.log('📊 Database:', mongoose.connection.name);
    console.log('📍 Host:', mongoose.connection.host);
    
  } catch (error) {
    console.error('❌ MongoDB Atlas Connection Error:', error.message);
    console.error('🔧 Troubleshooting:');
    console.error('   1. Check MongoDB Atlas Network Access → Add IP: 0.0.0.0/0');
    console.error('   2. Verify username/password in Database Access');
    console.error('   3. Make sure cluster is running (not paused)');
    
    // Don't crash the app in Vercel
    if (process.env.VERCEL) {
      console.log('⚠️ Vercel: Continuing without database connection');
    }
  }
};

// Connect immediately for Vercel
connectDB();

// Connection event listeners
mongoose.connection.on('connected', () => {
  console.log('📊 Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('📊 Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('📊 Mongoose disconnected from MongoDB');
});

// ====================
// SWAGGER DOCS - FIXED WITH YOUR URL
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
        url: 'https://inventory-api-blue.vercel.app/api/items',
        description: 'Production Server (Vercel)'
      },
      {
        url: 'http://localhost:5000',
        description: 'Development Server'
      }
    ],
    // ADD SCHEMAS FOR BETTER DOCUMENTATION
    components: {
      schemas: {
        Item: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'Laptop' },
            quantity: { type: 'number', example: 10 },
            price: { type: 'number', example: 50000 },
            category: { type: 'string', example: 'Electronics' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        ItemInput: {
          type: 'object',
          required: ['name', 'quantity', 'price'],
          properties: {
            name: { type: 'string', example: 'Laptop' },
            quantity: { type: 'number', example: 10 },
            price: { type: 'number', example: 50000 },
            category: { type: 'string', example: 'Electronics' }
          }
        }
      }
    },
    tags: [
      {
        name: 'Items',
        description: 'Item management endpoints'
      }
    ]
  },
  apis: ['./routes/*.js'],
};

const swaggerSpecs = swaggerJsDoc(swaggerOptions);

// Use CDN for Swagger to avoid CSP issues
const swaggerUISetup = swaggerUI.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customCssUrl: 'https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui.css',
  customJs: [
    'https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui-bundle.js',
    'https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui-standalone-preset.js'
  ],
  swaggerOptions: {
    tryItOutEnabled: true,
    docExpansion: 'list'
  }
});

app.use('/api-docs', swaggerUI.serve, swaggerUISetup);

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
    message: 'Inventory API is running on Vercel! 🚀',
    database: statusText,
    database_code: dbStatus,
    endpoints: {
      documentation: '/api-docs',
      items_api: '/api/items',
      health_check: '/health'
    },
    deployed_on: 'Vercel',
    status: 'operational',
    project_url: 'https://inventory-jnc9d2p3n-john-lloyds-projects-3baf7b6d.vercel.app'
  });
});

app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const isHealthy = dbStatus === 1;
  const statusCodes = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'healthy' : 'unhealthy',
    database: statusCodes[dbStatus] || 'unknown',
    database_code: dbStatus,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongodb_configured: !!process.env.MONGODB_URI,
    project_url: 'https://inventory-jnc9d2p3n-john-lloyds-projects-3baf7b6d.vercel.app'
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
    ],
    project_url: 'https://inventory-jnc9d2p3n-john-lloyds-projects-3baf7b6d.vercel.app'
  });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    project_url: 'https://inventory-jnc9d2p3n-john-lloyds-projects-3baf7b6d.vercel.app'
  });
});

// ====================
// VERCEL SERVERLESS EXPORT
// ====================
module.exports = app;