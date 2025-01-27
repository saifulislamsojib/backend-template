import AppError from '@/errors/AppError';
import omit from '@/utils/omit';
import { BAD_REQUEST, NOT_FOUND } from 'http-status';
import type { ObjectId } from 'mongoose';
import User from '../user/user.model';
import type TUser from '../user/user.types';
import { createJWT, hashText } from './auth.utils';

export const registerUserToDb = async (payload: Omit<TUser, '_id'>) => {
  const { email } = payload;

  // check user is already registered or not
  const isExist = await User.findOne({ email });
  if (isExist) {
    throw new AppError(BAD_REQUEST, 'The User already exists by the email');
  }

  // Now create the user
  const user = await new User(payload).save();

  // create jwt token
  const token = createJWT({ email: user.email, _id: user._id, role: user.role });

  return {
    token,
    user: omit(user.toObject(), 'password', 'passwordUpdatedAt', '__v'),
  };
};

export const loginUserFromDb = async (payload: Pick<TUser, 'email' | 'password'>) => {
  const { email, password } = payload;

  // check the user found or not
  const user = await User.findOne({ email }).select('+password');
  if (!user?._id) {
    throw new AppError(NOT_FOUND, 'User not found with the email');
  }

  // check the user password
  if (!(await user.isValidPassword(password))) {
    throw new AppError(BAD_REQUEST, 'Password is not valid');
  }

  // create jwt token
  const token = createJWT({ email: user.email, _id: user._id, role: user.role });

  return {
    token,
    user: omit(user.toObject(), 'password', 'passwordUpdatedAt', '__v'),
  };
};

export const changePasswordToDb = async (userId: string | ObjectId, payload: Params) => {
  const { currentPassword, newPassword } = payload;

  if (currentPassword?.trim() === newPassword?.trim()) {
    throw new AppError(BAD_REQUEST, 'Current password and new password cannot be the same', null);
  }

  const user = await User.findById(userId).select('+password');

  if (!user) {
    throw new AppError(NOT_FOUND, 'User not found');
  }

  // check currentPassword
  if (!(await user.isValidPassword(currentPassword!))) {
    throw new AppError(BAD_REQUEST, 'Current password is not matched');
  }

  // hash password
  const hashedPassword = await hashText(newPassword!);

  const data = await User.findByIdAndUpdate(userId, {
    password: hashedPassword,
    passwordUpdatedAt: new Date(),
  });
  if (!data) {
    throw new AppError(BAD_REQUEST, 'Password change failed');
  }

  // create jwt token
  const token = createJWT({ email: user.email, _id: user._id, role: user.role });

  return {
    token,
    user: omit(user.toObject(), 'password', 'passwordUpdatedAt', '__v'),
  };
};
