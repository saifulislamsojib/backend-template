import AppError from '@/errors/AppError';
import { verifyJWT } from '@/modules/auth/auth.utils';
import User from '@/modules/user/user.model';
import type { Role } from '@/modules/user/user.types';
import catchAsync from '@/utils/catchAsync';
import { NOT_FOUND, UNAUTHORIZED } from 'http-status';

const authCheck = (...roles: Role[]) => {
  return catchAsync(async (req, _res, next) => {
    const { authorization } = req.headers;

    // check authorization send from client
    if (!authorization) {
      throw new AppError(UNAUTHORIZED, 'Invalid token!');
    }

    // check authorization token
    const payload = verifyJWT(authorization);

    // check user exist or not
    const user = await User.findById(payload._id).select('+passwordUpdatedAt');
    if (!user) {
      throw new AppError(NOT_FOUND, 'This user not found!');
    }

    const { email, _id, role, name, createdAt, updatedAt, passwordUpdatedAt } = user;

    // after password update invalid the old token
    if (passwordUpdatedAt && payload.iat) {
      const passwordChangedTime = parseInt(
        (new Date(passwordUpdatedAt).getTime() / 1000).toString(),
        10,
      );
      if (passwordChangedTime > payload.iat) {
        throw new AppError(UNAUTHORIZED, 'Invalid token!');
      }
    }

    // after email update invalid the old token
    if (email !== payload.email) {
      throw new AppError(UNAUTHORIZED, 'Invalid token!');
    }

    // after role update invalid the old token
    if (role !== payload.role) {
      throw new AppError(UNAUTHORIZED, 'Invalid token!');
    }

    // check user role authorization
    if (roles && !roles.includes(role)) {
      throw new AppError(
        UNAUTHORIZED,
        'You do not have the necessary permissions to access this resource!',
      );
    }

    // all ok, then add payload and user in request and call next function
    req.user = { ...payload, _id, name, email, role, createdAt, updatedAt };
    next();
  });
};

export default authCheck;
