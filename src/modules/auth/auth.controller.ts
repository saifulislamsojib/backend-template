import catchAsync from '@/utils/catchAsync';
import sendResponse from '@/utils/sendResponse';
import { CREATED, OK } from 'http-status';
import { changePasswordToDb, loginUserFromDb, registerUserToDb } from './auth.service';

export const registerUser = catchAsync(async (req, res) => {
  const data = await registerUserToDb(req.body);
  return sendResponse(res, {
    data,
    message: 'User registered successfully',
    statusCode: CREATED,
    success: true,
  });
});

export const loginUser = catchAsync(async (req, res) => {
  const data = await loginUserFromDb(req.body);
  return sendResponse(res, {
    data,
    message: 'User login successful',
    statusCode: OK,
    success: true,
  });
});

export const changePassword = catchAsync(async (req, res) => {
  const data = await changePasswordToDb(req.user!._id, req.body);
  return sendResponse(res, {
    data,
    message: 'Password changed successfully',
    statusCode: OK,
    success: true,
  });
});

export const getCurrentUser = catchAsync(async (req, res) => {
  const data = req.user!;
  return sendResponse(res, {
    data,
    message: 'Current user data retrieved successfully',
    statusCode: OK,
    success: true,
  });
});
