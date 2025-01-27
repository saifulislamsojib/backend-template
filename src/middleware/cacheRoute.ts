import configs from '@/configs';
import client from '@/configs/redis';
import catchAsync from '@/utils/catchAsync';
import sendResponse from '@/utils/sendResponse';
import type { Request } from 'express';

type Type = 'public' | 'protected';

/**
 * Generates a cache key for the given request.
 * If the type is 'protected', the user's id and role will be appended to the key.
 * @param req - The express request object.
 * @param type - The type of the cache. If 'public', the cache is not user-specific.
 *               If 'protected', the cache is user-specific and will be prefixed with the user's id and role.
 * @returns The generated cache key.
 */
export const getRouteCacheKey = (req: Request, type: Type = 'protected') => {
  let key = req.originalUrl;
  if (type === 'protected' && req.user) {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    key += `:${req.user._id?.toString()}:${req.user.role}`;
  }
  return key;
};

/**
 * A middleware function that checks if the request has a cached response in Redis.
 * If so, it will return the cached response. Otherwise, it will call the next middleware.
 *
 * @param type - The type of the cache. If 'public', the cache is not user-specific.
 *               If 'protected', the cache is user-specific and will be prefixed with the user's id and role.
 * @returns A middleware function that checks for a cached response.
 */
const cacheRoute = (type: Type = 'protected') => {
  return catchAsync(async (req, res, next) => {
    const cached = await client.get(getRouteCacheKey(req, type));
    if (cached) {
      return sendResponse(res, {
        data: JSON.parse(cached) as AnyObject,
        message: 'Data retrieved successfully from cache',
        statusCode: 200,
        success: true,
      });
    }
    return next();
  });
};

/**
 * Set a cache for a route.
 *
 * @param req - The request object.
 * @param data - The data to be cached.
 * @param type - The type of the cache. If 'public', the cache is not user-specific.
 *               If 'protected', the cache is user-specific and will be prefixed with the user's id and role.
 * @returns A promise that resolves when the cache is set.
 */
export const setRouteCache = (req: Request, data: unknown, type: Type = 'protected') => {
  const key = getRouteCacheKey(req, type);

  return client.setEx(key, configs.cache_revalidate_time, JSON.stringify(data));
};

/**
 * Delete a cache for a route.
 *
 * @param req - The request object.
 * @param type - The type of the cache. If 'public', the cache is not user-specific.
 *               If 'protected', the cache is user-specific and will be prefixed with the user's id and role.
 * @returns A promise that resolves when the cache is deleted.
 */
export const deleteRouteCache = (req: Request, type: Type = 'protected') => {
  return client.del(getRouteCacheKey(req, type));
};

export default cacheRoute;
