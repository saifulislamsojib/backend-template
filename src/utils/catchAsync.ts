import { translateDatabaseError } from "@/errors/mongooseErrors";
import type { Request, RequestHandler } from "express";

type Handler<T> = RequestHandler<Request["params"], Request["body"], T, Params>;

/**
 * A higher-order function that takes a request handler function and returns
 * a new function that wraps the given function in a try-catch block.
 *
 * Known database errors are translated at this HTTP boundary before being passed to the next
 * middleware function in the application's request-response cycle.
 *
 * @param requestHandler - the function to be wrapped
 * @returns the wrapped function
 */
const catchAsync = <T extends AnyObject | undefined>(requestHandler: Handler<T>): Handler<T> => {
  return async (req, res, next) => {
    try {
      await Promise.resolve(requestHandler(req, res, next));
    } catch (err) {
      next(translateDatabaseError(err));
    }
  };
};

export default catchAsync;
