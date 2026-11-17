import catchAsync from "@/utils/catchAsync";
import type { ZodObject } from "zod";

type Target = "body" | "params" | "query";

/**
 * Validate request data using a zod schema middleware creator function.
 *
 * @param schema - zod schema for validation
 * @param target - the request part to validate: `body` (default), `params`, or `query`
 * @returns validator middleware
 */
const validateRequest = (schema: ZodObject, target: Target = "body") => {
  return catchAsync(async (req, _res, next) => {
    const parsed = await schema.parseAsync(req[target]);

    // Express 5 exposes `req.query` as a getter that re-parses the URL on every
    // access, so assigning or mutating it does not persist. Redefine it as a
    // plain data property holding the validated values instead.
    if (target === "query") {
      Object.defineProperty(req, "query", {
        value: parsed,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } else {
      req[target] = parsed as never;
    }

    next();
  });
};

export default validateRequest;
