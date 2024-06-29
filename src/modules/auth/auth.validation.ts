import { z } from 'zod';

const passwordSchema = (field = 'Password') => {
  return z
    .string()
    .trim()
    .refine((password) => password.length >= 8, {
      message: `${field} must be at least 8 characters long`,
    })
    .refine((password) => /[A-Z]/.test(password), {
      message: `${field} must contain at least one uppercase letter`,
    })
    .refine((password) => /[a-z]/.test(password), {
      message: `${field} must contain at least one lowercase letter`,
    })
    .refine((password) => /\d/.test(password), {
      message: `${field} must contain at least one digit`,
    })
    .refine((password) => /[!@#$%^&*(),.?":{}|<>]/.test(password), {
      message: `${field} must contain at least one special character`,
    });
};

export const registerUserSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: z.string().email(),
  password: passwordSchema(),
});

export const loginUserSchema = z.object({
  email: z.string().email(),
  password: passwordSchema(),
});

export const changePasswordSchema = z.object({
  currentPassword: passwordSchema('currentPassword'),
  newPassword: passwordSchema('newPassword'),
});
