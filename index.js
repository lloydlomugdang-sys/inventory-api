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
// DYNAMIC SWAGGER SCHEMA GENERATOR
// ====================
function generateDynamicSchemas() {
  try {
    // Load the Item model
    const Item = require('./models/Item');
    const schema = Item.schema;
    
    const itemProperties = {};
    const itemInputProperties = {};
    const requiredFields = [];
    
    // Get all schema paths
    for (const [pathName, path] of Object.entries(schema.paths)) {
      // Skip internal/technical fields
      if (pathName.startsWith('_') || pathName === '__v' || 
          pathName === 'createdAt' || pathName === 'updatedAt') {
        continue;
      }
      
      // Determine Swagger type from Mongoose type
      let swaggerType = 'string';
      let exampleValue = 'Example';
      
      if (path.instance === 'String') {
        swaggerType = 'string';
        exampleValue = getStringExample(pathName);
      } else if (path.instance === 'Number') {
        swaggerType = 'number';
        exampleValue = getNumberExample(pathName);
      } else if (path.instance === 'Boolean') {
        swaggerType = 'boolean';
        exampleValue = true;
      } else if (path.instance === 'Date') {
        swaggerType = 'string';
        exampleValue = new Date().toISOString();
      }
      
      // Create field definition
      const fieldDef = {
        type: swaggerType,
        example: exampleValue
      };
      
      // Add validation constraints
      if (path.options && path.options.min !== undefined) {
        fieldDef.minimum = path.options.min;
      }
      if (path.options && path.options.max !== undefined) {
        fieldDef.maximum = path.options.max;
      }
      if (path.options && path.options.default !== undefined) {
        fieldDef.default = path.options.default;
      }
      
      // Add to properties
      itemProperties[pathName] = fieldDef;
      itemInputProperties[pathName] = { ...fieldDef };
      
      // Check if required
      if (path.isRequired && pathName !== '_id') {
        requiredFields.push(pathName);
      }
    }
    
    // Helper functions for examples
    function getStringExample(fieldName) {
      const examples = {
        'name': 'Laptop',
        'category': 'Electronics',
        'description': 'High-performance device',
        'sku': 'ABC-123'
      };
      return examples[fieldName] || 'Sample Text';
    }
    
    function getNumberExample(fieldName) {
      const examples = {
        'quantity': 10,
        'price': 50000,
        'stock': 100,
        'weight': 2.5
      };
      return examples[fieldName] || 100;
    }
    
    // Return dynamic schemas
    return {
      Item: {
        type: 'object',
        properties: {
          _id: { 
            type: 'string', 
            example: '507f1f77bcf86cd799439011',
            description: 'Auto-generated MongoDB ID'
          },
          ...itemProperties,
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00.000Z',
            description: 'Creation timestamp'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00.000Z',
            description: 'Last update timestamp'
          }
        }
      },
      ItemInput: {
        type: 'object',
        required: requiredFields,
        properties: itemInputProperties,
        description: 'Input schema for creating/updating items'
      }
    };
    
  } catch (error) {
    console.error('⚠️ Could not generate dynamic schemas:', error.message);
    console.log('📝 Using static schemas as fallback');
    
    // Fallback to static schemas
    return {
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
    };
  }
}

// Generate dynamic schemas
const dynamicSchemas = generateDynamicSchemas();

// ====================
// SWAGGER DOCS WITH DYNAMIC SCHEMAS
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
        url: 'https://inventory-api-blue.vercel.app',
        description: 'Production Server (Vercel)'
      },
      {
        url: 'http://localhost:5000',
        description: 'Development Server'
      }
    ],
    // DYNAMIC SCHEMAS - Auto-generated from Mongoose model
    components: {
      schemas: dynamicSchemas
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
    project_url: 'https://inventory-api-blue.vercel.app',
    features: {
      dynamic_schemas: true,
      total_endpoints: 10,
      swagger_ui: '/api-docs'
    }
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
    project_url: 'https://inventory-api-blue.vercel.app',
    dynamic_schemas: true
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
    project_url: 'https://inventory-api-blue.vercel.app',
    note: 'Schemas are dynamically generated from Mongoose models'
  });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    project_url: 'https://inventory-api-blue.vercel.app'
  });
});

// ====================
// VERCEL SERVERLESS EXPORT
// ====================
module.exports = app;