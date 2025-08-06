import type { TUser } from '../user/user.types.ts';

type JWTDecoded = { exp?: number; iat?: number };

export type JWTPayload = Pick<TUser, 'email' | '_id' | 'role'>;
export type AuthPayload = Omit<JWTPayload, '_id'> & JWTDecoded & { _id: string };
export type AuthUser = JWTPayload & JWTDecoded & Pick<TUser, 'name' | 'createdAt' | 'updatedAt'>;
