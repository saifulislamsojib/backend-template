import configs from '@/configs';
import client from '@/configs/redis';
import catchAsync from '@/utils/catchAsync';
import sendResponse from '@/utils/sendResponse';
import type { Request } from 'express';

const cacheRoute = (type: 'public' | 'protected' = 'protected') => {
  return catchAsync(async (req, res, next) => {
    let key = req.originalUrl;
    if (type === 'protected' && req.user) {
      key += `:${req.user._id}:${req.user.role}`;
    }
    const cached = await client.get(key);
    if (cached) {
      return sendResponse(res, {
        data: JSON.parse(cached),
        message: 'Data retrieved successfully from cache',
        statusCode: 200,
        success: true,
      });
    }
    return next();
  });
};

export const setRouteCache = async (
  req: Request,
  data: unknown,
  type: 'public' | 'protected' = 'protected',
) => {
  let key = req.originalUrl;
  if (type === 'protected' && req.user) {
    key += `:${req.user._id}:${req.user.role}`;
  }

  return client.setEx(key, configs.cache_revalidate_time, JSON.stringify(data));
};

export default cacheRoute;
