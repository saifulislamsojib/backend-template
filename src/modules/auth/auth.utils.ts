import env from '@/configs/env';
import AppError from '@/errors/AppError';
import bcrypt from 'bcrypt';
import type { Request, Response } from 'express';
import { status } from 'http-status';
import jwt from 'jsonwebtoken';
import type { AuthPayload, JWTPayload } from './auth.types';

/**
 * Hash a given plaintext string using bcrypt.
 * @param plaintext - The plaintext string to hash.
 * @returns A promise that resolves the hashed string.
 */
export const hashText = (plaintext: string) => {
  return bcrypt.hash(plaintext, env.BCRYPT_SALT_ROUNDS);
};

/**
 * Compare a given plaintext string with a hashed string using bcrypt.
 * @param plaintext - The plaintext string to compare.
 * @param hashed - The hashed string to compare against.
 * @returns A promise that resolves true if the comparison is valid, otherwise false.
 */
export const compareHashedText = (plaintext: string, hashed: string) => {
  return bcrypt.compare(plaintext, hashed);
};

/**
 * Create a new JWT token based on the given payload.
 * @param payload - The payload to use in the JWT token.
 * @returns The newly created JWT token.
 */
export const createJWT = (payload: JWTPayload) => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: `${env.JWT_ACCESS_EXPIRES_IN_MINUTES}m`,
  });
};

/**
 * Verify a given JWT token.
 * @param token - The JWT token to verify.
 * @returns The payload of the verified JWT token.
 * @throws AppError If the token is invalid.
 */
export const verifyJWT = (token: string) => {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthPayload;
  } catch {
    throw new AppError(status.UNAUTHORIZED, 'Invalid token!');
  }
};

export const AUTH_TOKEN_KEY = 'access-token';

export const X_APP_KEY = 'x-app-key';

/**
 * Checks if the provided app key is valid.
 * @param req - The request object.
 * @returns True if the app key is valid, false otherwise.
 */
export const isAppKeyValid = (req: Pick<Request, 'get'>) => {
  return req.get(X_APP_KEY) === env.APP_KEY;
};

const isSecure = env.NODE_ENV !== 'development';

/**
 * Sets an authentication cookie with the provided JWT token.
 * @param res - The response object used to set the cookie.
 * @param token - The JWT token to be stored in the cookie.
 * The cookie is set with HttpOnly, SameSite=lax, and Secure attributes for security,
 * and is configured to expire in JWT_ACCESS_EXPIRES_IN_MINUTES from env.
 */

export const setAuthCookie = (res: Pick<Response, 'cookie'>, token: string) => {
  return res.cookie(AUTH_TOKEN_KEY, token, {
    maxAge: 1000 * 60 * env.JWT_ACCESS_EXPIRES_IN_MINUTES,
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure,
  });
};
