import type { TUser } from '@/modules/user/user.types';
import catchAsync from '@/utils/catchAsync';
import omit from '@/utils/omit';
import sendResponse from '@/utils/sendResponse';
import { status } from 'http-status';
import { changePasswordToDb, loginUserFromDb, registerUserToDb } from './auth.service';
import { isAppKeyValid, setAuthCookie } from './auth.utils';

export const registerUser = catchAsync<Omit<TUser, '_id'>>(async (req, res) => {
  const { token, user } = await registerUserToDb(req.body);
  setAuthCookie(res, token);
  return sendResponse(res, {
    data: isAppKeyValid(req) ? { user, token } : { user },
    message: 'User registered successfully',
    statusCode: status.CREATED,
    success: true,
  });
});

export const loginUser = catchAsync<Pick<TUser, 'email' | 'password'>>(async (req, res) => {
  const { token, user } = await loginUserFromDb(req.body);
  setAuthCookie(res, token);
  return sendResponse(res, {
    data: isAppKeyValid(req) ? { user, token } : { user },
    message: 'User login successful',
    statusCode: status.OK,
    success: true,
  });
});

export const changePassword = catchAsync<Params>(async (req, res) => {
  const { token, user } = await changePasswordToDb(req.user!._id, req.body);
  setAuthCookie(res, token);
  return sendResponse(res, {
    data: isAppKeyValid(req) ? { user, token } : { user },
    message: 'Password changed successfully',
    statusCode: status.OK,
    success: true,
  });
});

export const getCurrentUser = catchAsync((req, res) => {
  const data = omit(req.user!, 'exp', 'iat');
  return sendResponse(res, {
    data,
    message: 'Current user data retrieved successfully',
    statusCode: status.OK,
    success: true,
  });
});
