import env from '@/configs/env';
import client from '@/configs/redis';
import AppError from '@/errors/AppError';
import { rateLimit, type Options } from 'express-rate-limit';
import { status } from 'http-status';
import { RedisStore } from 'rate-limit-redis';

type RateLimitOptions = {
  windowMs?: number;
  limit?: number;
  message?: string;
  prefix?: string;
  skipInTest?: boolean;
};

/**
 * * Create a rate limiter
 * @param options - Rate limiter options
 * @returns - Rate limit middleware
 */
export const createRateLimiter = (options: RateLimitOptions = {}) => {
  const {
    windowMs = 10 * 60 * 1000, // 10 minutes
    limit = 10, // 10 requests per 10 minutes
    message = 'Too many requests, please try again later.',
    prefix = 'rl:',
    skipInTest = true,
  } = options;

  const isTest = env.NODE_ENV === 'test';

  const config: Partial<Options> = {
    windowMs,
    limit,
    legacyHeaders: false,
    standardHeaders: true,
    skip: () => skipInTest && isTest,
    handler: () => {
      throw new AppError(status.TOO_MANY_REQUESTS, message);
    },
  };

  if (!isTest) {
    config.store = new RedisStore({
      sendCommand: (...args: string[]) => client.sendCommand(args),
      prefix,
    });
  }

  return rateLimit(config);
};

/**
 * * Login, Register, Forgot Password, Verify Email
 * * 5 requests per 10 minutes
 */
export const authRateLimiter = createRateLimiter({
  limit: 5,
  prefix: 'rl:auth:',
  message: 'Too many authentication attempts. Please try again later.',
});
