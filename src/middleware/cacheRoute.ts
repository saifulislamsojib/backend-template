import catchAsync from '@/utils/catchAsync';
import { deleteCacheKey, getCache, setCache } from '@/utils/redis';
import sendResponse from '@/utils/sendResponse';
import type { Request } from 'express';
import { status } from 'http-status';

type Type = 'public' | 'protected';

/**
 * Generates a cache key for the given request.
 * If the type is 'protected', the user's id and role will be appended to the key.
 * @param req - The express request object.
 * @param type - The type of the cache. If 'public', the cache is not user-specific.
 *               If 'protected', the cache is user-specific and will be prefixed with the user's id and role.
 * @returns The generated cache key.
 */
const getRouteCacheKey = (req: Request, type: Type = 'public') => {
  let key = req.originalUrl;
  if (type === 'protected' && req.user) {
    key += `:${req.user._id.toString()}:${req.user.role}`;
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
const cacheRoute = (type: Type = 'public') => {
  return catchAsync(async (req, res, next) => {
    const cached = await getCache<AnyObject>(getRouteCacheKey(req, type));
    if (cached !== undefined) {
      return sendResponse(res, {
        data: cached,
        message: 'Data retrieved successfully from cache',
        statusCode: status.OK,
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
const setRouteCache = (req: Request, data: unknown, type: Type = 'public') => {
  const key = getRouteCacheKey(req, type);

  return setCache(key, data);
};

/**
 * Delete a cache for a route.
 *
 * @param req - The request object.
 * @param type - The type of the cache. If 'public', the cache is not user-specific.
 *               If 'protected', the cache is user-specific and will be prefixed with the user's id and role.
 * @returns A promise that resolves when the cache is deleted.
 */
const deleteRouteCache = (req: Request, type: Type = 'public') => {
  return deleteCacheKey(getRouteCacheKey(req, type));
};

export { deleteRouteCache, getRouteCacheKey, setRouteCache };
export default cacheRoute;
