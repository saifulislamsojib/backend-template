import AppError from '@/errors/AppError';
import { verifyJWT } from '@/modules/auth/auth.utils';
import User from '@/modules/user/user.model';
import { Role } from '@/modules/user/user.types';
import catchAsync from '@/utils/catchAsync';
import { NOT_FOUND, UNAUTHORIZED } from 'http-status';

const authCheck = (...roles: Role[]) => {
  return catchAsync(async (req, _res, next) => {
    const { authorization } = req.headers;

    // check authorization send from client
    if (!authorization) {
      throw new AppError(UNAUTHORIZED, 'Invalid token');
    }

    // check authorization token
    const payload = verifyJWT(authorization);
    // check user exist or not
    const isUserExist = await User.findById(payload._id);
    if (!isUserExist) {
      throw new AppError(NOT_FOUND, 'User not found');
    }

    // check user role authorization
    if (roles && !roles.includes(isUserExist.role)) {
      throw new AppError(UNAUTHORIZED, 'You are not authorized!');
    }

    // all ok, then add payload and user in request and call next function
    const { email, _id, role, name, createdAt, updatedAt } = isUserExist;
    req.user = { ...payload, _id, name, email, role, createdAt, updatedAt };
    next();
  });
};

export default authCheck;
