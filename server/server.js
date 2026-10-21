require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const seedDatabase = require('./seed');
const { getStoragePath } = require('./config/storage');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Security and utility middlewares
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const configuredOrigin = process.env.CLIENT_URL || 'http://127.0.0.1:5173';
    const allowedOrigins = new Set([
      new URL(configuredOrigin).origin,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://gokzz-glitch.github.io',
    ]);
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Create uploads directories if they don't exist
const uploadsDir = getStoragePath('uploads');
const docsDir = getStoragePath('uploads', 'documents');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    success: connected,
    status: connected ? 'ready' : 'database_unavailable',
    database: mongoose.connection.name || null,
  });
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/requests', require('./routes/request.routes'));
app.use('/api/approvals', require('./routes/approval.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/documents', require('./routes/document.routes'));

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
let httpServer;
let localMongoServer;

const start = async () => {
  const database = await connectDB();
  localMongoServer = database.localMongoServer;
  await seedDatabase();
  httpServer = app.listen(PORT, () => {
    console.log(`Server ready in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

const shutdown = async (signal) => {
  console.log(`${signal}: shutting down academic workspace`);
  if (httpServer) await new Promise((resolve) => httpServer.close(resolve));
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  if (localMongoServer) await localMongoServer.stop({ doCleanup: false });
  process.exit(0);
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  shutdown('unhandledRejection');
});

start().catch((error) => {
  console.error('Application startup failed:', error);
  process.exit(1);
});
