import { Types } from 'mongoose';
import { z } from 'zod';

export const userRoles = ['user', 'admin', 'super-admin'] as const;

export type Role = (typeof userRoles)[number];

export const objectIdZod = z.string().refine((value) => Types.ObjectId.isValid(value), {
  error: 'Invalid database id pattern',
});
