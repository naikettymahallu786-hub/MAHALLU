import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

let redisClient: RedisClientType;

export async function connectRedis(): Promise<void> {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 2) {
            return false; // Stop reconnecting
          }
          return 500; // Retry after 500ms
        }
      }
    }) as RedisClientType;

    redisClient.on('error', (err) => logger.error('Redis error:', err));
    redisClient.on('connect', () => logger.info('✅ Redis connected'));
    redisClient.on('reconnecting', () => logger.warn('Redis reconnecting...'));

    await redisClient.connect();
  } catch (error) {
    logger.warn('Redis not available, using in-memory fallback:', error);
    // Continue without Redis — rate limiting will use memory store
  }
}

export function getRedisClient(): RedisClientType | null {
  return redisClient || null;
}

export async function setCache(key: string, value: string, ttlSeconds: number): Promise<void> {
  if (!redisClient?.isOpen) return;
  await redisClient.setEx(key, ttlSeconds, value);
}

export async function getCache(key: string): Promise<string | null> {
  if (!redisClient?.isOpen) return null;
  return redisClient.get(key);
}

export async function deleteCache(key: string): Promise<void> {
  if (!redisClient?.isOpen) return;
  await redisClient.del(key);
}

export async function addToBlacklist(token: string, ttlSeconds: number): Promise<void> {
  await setCache(`blacklist:${token}`, '1', ttlSeconds);
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const val = await getCache(`blacklist:${token}`);
  return val === '1';
}
