import authCheck from "@/middleware/authCheck";
import { authRateLimiter } from "@/middleware/rateLimiter";
import validateRequest from "@/middleware/validateRequest";
import { userRoles } from "@/modules/user/user.constant";
import { Router } from "express";
import authController from "./auth.controller";
import authValidation from "./auth.validation";

const authRoutes = Router();

authRoutes.get("/me", authCheck(...userRoles), authController.getCurrentUser);
authRoutes.post(
  "/register",
  authRateLimiter,
  validateRequest(authValidation.registerUserSchema),
  authController.registerUser,
);
authRoutes.post(
  "/login",
  authRateLimiter,
  validateRequest(authValidation.loginUserSchema),
  authController.loginUser,
);
authRoutes.post(
  "/change-password",
  authCheck(...userRoles),
  validateRequest(authValidation.changePasswordSchema),
  authController.changePassword,
);

export default authRoutes;
