import type { RequestHandler } from 'express';

/**
 * A middleware function that catches errors and passes them to the global error
 * handler middleware, using `next(err)`. Meant to be used with functions that return
 * Promises, such as async functions.
 *
 * @param {RequestHandler} requestHandler - A function that takes `(req, res, next)`
 *   and returns a Promise.
 * @returns {RequestHandler} A new middleware function that calls the
 *   original function, catches any errors, and passes them to `next(err)`.
 */
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
