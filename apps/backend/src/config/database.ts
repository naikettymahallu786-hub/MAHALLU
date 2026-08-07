import mongoose from 'mongoose';
import { logger } from './logger';
import '../models';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_URI_LOCAL || 'mongodb://localhost:27017/mahallu-erp';

  mongoose.set('strictQuery', false);

  // Auto-add tenantId to all queries via middleware
  mongoose.plugin((schema) => {
    schema.pre(['find', 'findOne', 'findOneAndUpdate', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany', 'countDocuments'], function (next) {
      // Soft delete filter: exclude deleted documents by default
      if (this.getFilter && !this.getFilter().isDeleted && !this.getOptions?.()?.includeDeleted) {
        this.where({ isDeleted: { $ne: true } });
      }
      next();
    });
  });

  try {
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`✅ MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

  } catch (error) {
    logger.error('Primary MongoDB connection failed. Trying local fallback...', error);
    if (process.env.MONGODB_URI_LOCAL && uri !== process.env.MONGODB_URI_LOCAL) {
      try {
        const conn = await mongoose.connect(process.env.MONGODB_URI_LOCAL, {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
        });
        logger.info(`✅ Local MongoDB connected fallback: ${conn.connection.host}`);
        return;
      } catch (localErr) {
        logger.error('Local MongoDB fallback also failed:', localErr);
      }
    }
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected.');
}
