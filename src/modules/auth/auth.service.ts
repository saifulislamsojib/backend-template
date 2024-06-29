import AppError from '@/errors/AppError';
import omit from '@/utils/omit';
import { BAD_REQUEST, NOT_FOUND } from 'http-status';
import { ObjectId } from 'mongoose';
import User from '../user/user.model';
import TUser from '../user/user.types';
import { comparePassword, createJWT, hashPassword } from './auth.utils';

export const registerUserToDb = async (payload: Omit<TUser, '_id'>) => {
  const { email } = payload;

  // check user is already registered or not
  const isExist = await User.findOne({ email });
  if (isExist) {
    throw new AppError(BAD_REQUEST, 'The User already exists by email');
  }

  // Now create the user
  const user = await new User(payload).save();

  // create jwt token
  const token = createJWT({ email: user.email, _id: user.id, role: user.role });

  // ready user response
  const userResponse = omit(user.toObject(), 'password', 'passwordUpdatedAt', '__v');

  return {
    token,
    user: userResponse,
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
  const isValidPassword = await comparePassword(password, user.password);
  if (!isValidPassword) {
    throw new AppError(BAD_REQUEST, 'Password is not valid');
  }

  // create jwt token
  const token = createJWT({ email: user.email, _id: user.id, role: user.role });

  // ready user response
  const userResponse = omit(user.toObject(), 'password', 'passwordUpdatedAt', '__v');

  return {
    token,
    user: userResponse,
  };
};

export const changePasswordToDb = async (
  userId: string | ObjectId,
  payload: Record<string, string>,
) => {
  const { currentPassword, newPassword } = payload;

  if (currentPassword.trim() === newPassword.trim()) {
    throw new AppError(BAD_REQUEST, 'Current password and new password cannot be the same', null);
  }

  const user = await User.findById(userId).select('+password');

  if (!user) {
    throw new AppError(NOT_FOUND, 'User not found');
  }

  // check currentPassword
  const isValid = await comparePassword(currentPassword, user?.password);
  if (!isValid) {
    throw new AppError(BAD_REQUEST, 'Current password is not matched');
  }

  // hash password
  const hashedPassword = await hashPassword(newPassword);

  const data = await User.findOneAndUpdate(
    { _id: userId },
    {
      password: hashedPassword,
      passwordUpdatedAt: new Date(),
    },
  );
  if (!data) {
    throw new AppError(BAD_REQUEST, 'Password change failed');
  }
  const userResponse = omit(user.toObject(), 'password', 'passwordUpdatedAt', '__v');
  return userResponse;
};
