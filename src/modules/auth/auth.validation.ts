import { z } from 'zod';

const passwordSchema = (field = 'Password') => {
  return z
    .string()
    .trim()
    .refine((password) => password.length >= 8, {
      error: `${field} must be at least 8 characters long`,
    })
    .refine((password) => /[A-Z]/.test(password), {
      error: `${field} must contain at least one uppercase letter`,
    })
    .refine((password) => /[a-z]/.test(password), {
      error: `${field} must contain at least one lowercase letter`,
    })
    .refine((password) => /\d/.test(password), {
      error: `${field} must contain at least one digit`,
    })
    .refine((password) => /[!@#$%^&*(),.?":{}|<>]/.test(password), {
      error: `${field} must contain at least one special character`,
    });
};

const loginSchemaObj = {
  email: z.email(),
  password: passwordSchema(),
};

export const registerUserSchema = z.object({
  name: z.string().trim().min(1).max(255),
  ...loginSchemaObj,
});

export const loginUserSchema = z.object(loginSchemaObj);

export const changePasswordSchema = z.object({
  currentPassword: passwordSchema('Current Password'),
  newPassword: passwordSchema('New Password'),
});
