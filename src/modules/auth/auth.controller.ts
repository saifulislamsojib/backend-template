import catchAsync from '@/utils/catchAsync';
import omit from '@/utils/omit';
import sendResponse from '@/utils/sendResponse';
import { CREATED, OK } from 'http-status';
import type TUser from '../user/user.types';
import { changePasswordToDb, loginUserFromDb, registerUserToDb } from './auth.service';
import { setAuthCookie } from './auth.utils';

export const registerUser = catchAsync<Omit<TUser, '_id'>>(async (req, res) => {
  const data = await registerUserToDb(req.body);
  return sendResponse(setAuthCookie(res, data.token), {
    data,
    message: 'User registered successfully',
    statusCode: CREATED,
    success: true,
  });
});

export const loginUser = catchAsync<Pick<TUser, 'email' | 'password'>>(async (req, res) => {
  const data = await loginUserFromDb(req.body);
  return sendResponse(setAuthCookie(res, data.token), {
    data,
    message: 'User login successful',
    statusCode: OK,
    success: true,
  });
});

export const changePassword = catchAsync<Params>(async (req, res) => {
  const data = await changePasswordToDb(req.user!._id, req.body);
  return sendResponse(res, {
    data,
    message: 'Password changed successfully',
    statusCode: OK,
    success: true,
  });
});

export const getCurrentUser = catchAsync((req, res) => {
  const data = omit(req.user!, 'exp', 'iat');
  return sendResponse(res, {
    data,
    message: 'Current user data retrieved successfully',
    statusCode: OK,
    success: true,
  });
});
