import 'dotenv/config';
import { createApp } from './app';
import { connectDB } from './config/database';
import { connectRedis } from './config/redis';
import { logger } from './config/logger';
import { initializeCronJobs } from './jobs';

const PORT = parseInt(process.env.PORT || '5000', 10);

async function bootstrap() {
  try {
    console.log(`🚀 Bootstrapping Mahallu ERP Backend on port ${PORT}...`);

    // Connect MongoDB
    try {
      await connectDB();
    } catch (dbErr) {
      console.error('❌ MongoDB Connection Failure:', dbErr);
      logger.error('MongoDB Connection Failure:', dbErr);
    }

    // Try Redis, but don't block server startup
    try {
      await connectRedis();
    } catch (error) {
      console.warn('⚠️ Redis unavailable. Continuing without Redis caching.');
      logger.warn('Redis unavailable. Continuing without Redis.');
    }

    const app = createApp();
    initializeCronJobs();

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Mahallu ERP Backend running on 0.0.0.0:${PORT}`);
      logger.info(`🚀 Mahallu ERP Backend running on port ${PORT}`);
      logger.info(`📡 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🌐 API Base: http://0.0.0.0:${PORT}/api/v1`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        logger.info('Server closed.');
        process.exit(0);
      });
    });

    process.on('unhandledRejection', (err: Error) => {
      console.error('⚠️ Unhandled Promise Rejection:', err);
      logger.error('Unhandled Promise Rejection:', err);
    });

    process.on('uncaughtException', (err: Error) => {
      console.error('⚠️ Uncaught Exception:', err);
      logger.error('Uncaught Exception:', err);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
