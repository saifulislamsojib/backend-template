import catchAsync from '@/utils/catchAsync';
import type { AnyZodObject } from 'zod';

const types = ['body', 'params', 'query'] as const;

type Type = (typeof types)[number];

/**
 * Validate request data using zod schema middleware creator function
 * @param schema - zod schema for validation
 * @param type - where to validate, default is body
 * @returns validator middleware
 */
const validateRequest = (schema: AnyZodObject, type: Type = 'body') => {
  if (!types.includes(type)) {
    throw new Error('Type must be body or params or query');
  }

  // validation check
  return catchAsync(async (req, _res, next) => {
    await schema.parseAsync(req[type]);
    next();
  });
};

export default validateRequest;
