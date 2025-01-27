import configs from '@/configs';
import AppError from '@/errors/AppError';
import bcrypt from 'bcrypt';
import { UNAUTHORIZED } from 'http-status';
import jwt from 'jsonwebtoken';
import type { AuthPayload, JWTPayload } from './auth.types';

/**
 * Hash a given plaintext string using bcrypt.
 * @param plaintext - The plaintext string to hash.
 * @returns A promise that resolves the hashed string.
 */
export const hashText = (plaintext: string) => {
  return bcrypt.hash(plaintext, configs.bcrypt_salt_rounds);
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
  return jwt.sign(payload, configs.jwt_access_secret, {
    expiresIn: configs.jwt_access_expires_in as `${number}`,
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
    return jwt.verify(token, configs.jwt_access_secret) as AuthPayload;
  } catch {
    throw new AppError(UNAUTHORIZED, 'Invalid token!');
  }
};
