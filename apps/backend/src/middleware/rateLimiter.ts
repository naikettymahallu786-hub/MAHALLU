import rateLimit from 'express-rate-limit';
import { logger } from '../config/logger';

export const globalRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX || '5000'), // Increased to 5000 for local dev hot-reloads
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    logger.warn('Rate limit exceeded');
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
    });
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 1000, // Increased to 1000 for dev
  skipSuccessfulRequests: true,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts, please wait 15 minutes.',
    });
  },
});

export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 20,
  handler: (_req, res) => {
    res.status(429).json({ success: false, message: 'Upload rate limit exceeded.' });
  },
});
