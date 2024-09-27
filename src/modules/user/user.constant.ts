import { Types } from 'mongoose';
import { z } from 'zod';

export const userRoles = ['user', 'admin', 'super-admin'] as const;

export const objectIdZod = z.string().refine((value) => Types.ObjectId.isValid(value), {
  message: 'Invalid database id pattern',
});
