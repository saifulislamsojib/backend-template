import catchAsync from '@/utils/catchAsync';
import type { ZodObject } from 'zod';

/**
 * Validate request data using zod schema middleware creator function
 * @param schema - zod schema for validation
 * @returns validator middleware
 */
const validateRequest = (schema: ZodObject) => {
  return catchAsync(async (req, _res, next) => {
    req.body = await schema.parseAsync(req.body);
    next();
  });
};

export default validateRequest;
