import { isObjectIdOrHexString } from 'mongoose';
import { z } from 'zod';

export const objectIdZod = z.string().refine((value) => isObjectIdOrHexString(value), {
  error: 'Invalid database id pattern',
});
