import catchAsync from '@/utils/catchAsync';
import omit from '@/utils/omit';
import sendResponse from '@/utils/sendResponse';
import { CREATED, OK } from 'http-status';
import type TUser from '../user/user.types';
import { changePasswordToDb, loginUserFromDb, registerUserToDb } from './auth.service';

export const registerUser = catchAsync(async (req, res) => {
  const data = await registerUserToDb(req.body as Omit<TUser, '_id'>);
  return sendResponse(res, {
    data,
    message: 'User registered successfully',
    statusCode: CREATED,
    success: true,
  });
});

export const loginUser = catchAsync(async (req, res) => {
  const data = await loginUserFromDb(req.body as Pick<TUser, 'email' | 'password'>);
  return sendResponse(res, {
    data,
    message: 'User login successful',
    statusCode: OK,
    success: true,
  });
});

export const changePassword = catchAsync(async (req, res) => {
  const data = await changePasswordToDb(req.user!._id, req.body as Record<string, string>);
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
