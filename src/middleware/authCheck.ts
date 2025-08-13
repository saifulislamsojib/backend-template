import AppError from '@/errors/AppError';
import { AUTH_TOKEN_KEY, verifyJWT } from '@/modules/auth/auth.utils';
import type { Role } from '@/modules/user/user.constant';
import User from '@/modules/user/user.model';
import catchAsync from '@/utils/catchAsync';
import { status } from 'http-status';

/**
 * Middleware to check authentication and authorization.
 *
 * This middleware will check if the `authorization` header is present, then verify the JWT token.
 * After that, it will check if the user exist or not, and if the user exist, it will check if the
 * user's password or email or role has been updated after the token was issued. If the user's
 * password or email or role has been updated, it will throw an invalid token error.
 *
 * If the user has the necessary permissions, it will add the `user` property to the `req` object
 * and call the next function, otherwise it will throw an unauthorized error.
 *
 * @param roles - The roles that are allowed to access this resource.
 * @returns A middleware function that checks authentication and authorization.
 */
const authCheck = (...roles: Role[]) => {
  return catchAsync(async (req, _res, next) => {
    const authorization = (req.cookies as Params)[AUTH_TOKEN_KEY] || req.headers.authorization;

    // check authorization send from client
    if (!authorization) throw new AppError(status.UNAUTHORIZED, 'Invalid token!');

    // check authorization token
    const payload = verifyJWT(authorization);

    // check user exist or not
    const user = await User.findById(payload._id).select('+passwordUpdatedAt');

    if (!user) throw new AppError(status.NOT_FOUND, 'This user not found!');

    const { email, _id, role, name, createdAt, updatedAt, passwordUpdatedAt } = user;

    // after password update invalid the old token
    if (passwordUpdatedAt && payload.iat) {
      const passwordChangedTime = Math.floor(new Date(passwordUpdatedAt).getTime() / 1000);
      if (passwordChangedTime > payload.iat) {
        throw new AppError(status.UNAUTHORIZED, 'Invalid token!');
      }
    }

    // after email update invalid the old token
    if (email !== payload.email) {
      throw new AppError(status.UNAUTHORIZED, 'Invalid token!');
    }

    // after role update invalid the old token
    if (role !== payload.role) {
      throw new AppError(status.UNAUTHORIZED, 'Invalid token!');
    }

    // check user role authorization
    if (roles.length && !roles.includes(role)) {
      throw new AppError(
        status.UNAUTHORIZED,
        'You do not have the necessary permissions to access this resource!',
      );
    }

    // all ok, then add payload and user in request and call next function
    req.user = { ...payload, _id, name, email, role, createdAt, updatedAt };
    next();
  });
};

export default authCheck;
