import catchAsync from '@/utils/catchAsync';
import type { RequestHandler } from 'express';
import type { AnyZodObject } from 'zod';

const types = ['body', 'params', 'query'] as const;

type Type = (typeof types)[number];

const validateRequest = (schema: AnyZodObject, type: Type = 'body'): RequestHandler => {
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
