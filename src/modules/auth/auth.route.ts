import authCheck from '@/middleware/authCheck.js';
import validateRequest from '@/middleware/validateRequest.js';
import { Router } from 'express';
import { userRoles } from '../user/user.constant.js';
import { changePassword, getCurrentUser, loginUser, registerUser } from './auth.controller.js';
import { changePasswordSchema, loginUserSchema, registerUserSchema } from './auth.validation.js';

const authRoutes = Router();

authRoutes.get('/me', authCheck(...userRoles), getCurrentUser);
authRoutes.post('/register', validateRequest(registerUserSchema), registerUser);
authRoutes.post('/login', validateRequest(loginUserSchema), loginUser);
authRoutes.post(
  '/change-password',
  authCheck(...userRoles),
  validateRequest(changePasswordSchema),
  changePassword,
);

export default authRoutes;
