import type { RequestHandler } from 'express';

const catchAsync = (requestHandler: RequestHandler): RequestHandler => {
  return async (req, res, next) => {
    try {
      await Promise.resolve(requestHandler(req, res, next));
    } catch (err) {
      next(err);
    }
  };
};

export default catchAsync;
