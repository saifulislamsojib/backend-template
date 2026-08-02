import AppError from '@/errors/AppError';
import User from '@/modules/user/user.model';
import type { TUser } from '@/modules/user/user.types';
import omit from '@/utils/omit';
import { status } from 'http-status';
import { compareHashedText, createJWT, hashText } from './auth.utils';

const DUMMY_HASH = '$2b$10$e7V/4X/t18f.5Ew1xV9.uO3zB9h5k.3y9jH.x4y.5z6a7b8c9d0e1';

export const registerUserToDb = async (payload: Omit<TUser, '_id'>) => {
  const { email } = payload;

  // check user is already registered or not
  const isExist = await User.exists({ email });
  if (isExist) {
    throw new AppError(status.BAD_REQUEST, 'The User already exists by the email');
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
    await compareHashedText(password, DUMMY_HASH);
    throw new AppError(status.UNAUTHORIZED, 'Invalid email or password');
  }

  // check the user password
  if (!(await user.isValidPassword(password))) {
    throw new AppError(status.UNAUTHORIZED, 'Invalid email or password');
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
    throw new AppError(
      status.BAD_REQUEST,
      'Current password and new password cannot be the same',
      null,
    );
  }

  const user = await User.findById(userId).select('+password');

  if (!user) {
    throw new AppError(status.NOT_FOUND, 'User not found');
  }

  // check currentPassword
  if (!(await user.isValidPassword(currentPassword!))) {
    throw new AppError(status.BAD_REQUEST, 'Current password is not matched');
  }

  // hash password
  const hashedPassword = await hashText(newPassword!);

  const result = await User.updateOne(
    { _id: userId },
    {
      password: hashedPassword,
      passwordUpdatedAt: new Date(),
    },
  );
  if (!result.modifiedCount) {
    throw new AppError(status.BAD_REQUEST, 'Password change failed');
  }

  // create jwt token
  const token = createJWT({ email: user.email, _id: user._id, role: user.role });

  return {
    token,
    user: omit(user.toObject(), 'password', 'passwordUpdatedAt', '__v'),
  };
};
