const mongoose = require('mongoose');
const { getStoragePath } = require('./storage');

let localMongoServer;

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  const connectOptions = {
    serverSelectionTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS || 4000),
  };

  if (mongoUri) {
    try {
      const connection = await mongoose.connect(mongoUri, connectOptions);
      console.log(`MongoDB Connected: ${connection.connection.host}`);
      return { connection: connection.connection, localMongoServer: null };
    } catch (error) {
      if (process.env.NODE_ENV === 'production') throw error;
      console.warn(`Primary MongoDB unavailable (${error.message}). Starting the local database.`);
    }
  }

  const dbPath = getStoragePath('mongo');
  const { MongoMemoryServer } = require('mongodb-memory-server');
  localMongoServer = await MongoMemoryServer.create({
    instance: {
      dbPath,
      storageEngine: 'wiredTiger',
    },
  });

  const connection = await mongoose.connect(localMongoServer.getUri(), connectOptions);
  console.log(`Local MongoDB Connected: ${connection.connection.host}`);
  console.log(`Local database files: ${dbPath}`);
  return { connection: connection.connection, localMongoServer };
};

module.exports = connectDB;
