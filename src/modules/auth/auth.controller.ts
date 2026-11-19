import catchAsync from "@/utils/catchAsync";
import omit from "@/utils/omit";
import sendResponse from "@/utils/sendResponse";
import { status } from "http-status";
import authService from "./auth.service";
import { isAppKeyValid, setAuthCookie } from "./auth.utils";
import type { ChangePasswordPayload, LoginPayload, RegisterPayload } from "./auth.validation";

const registerUser = catchAsync<RegisterPayload>(async (req, res) => {
  const { token, user } = await authService.registerUser(req.body);
  setAuthCookie(res, token);
  return sendResponse(res, {
    data: isAppKeyValid(req) ? { user, token } : { user },
    message: "User registered successfully",
    statusCode: status.CREATED,
    success: true,
  });
});

const loginUser = catchAsync<LoginPayload>(async (req, res) => {
  const { token, user } = await authService.loginUser(req.body);
  setAuthCookie(res, token);
  return sendResponse(res, {
    data: isAppKeyValid(req) ? { user, token } : { user },
    message: "User login successful",
    statusCode: status.OK,
    success: true,
  });
});

const changePassword = catchAsync<ChangePasswordPayload>(async (req, res) => {
  const { token, user } = await authService.changePassword(req.user!._id, req.body);
  setAuthCookie(res, token);
  return sendResponse(res, {
    data: isAppKeyValid(req) ? { user, token } : { user },
    message: "Password changed successfully",
    statusCode: status.OK,
    success: true,
  });
});

const getCurrentUser = catchAsync((req, res) => {
  const data = omit(req.user!, "exp", "iat");
  return sendResponse(res, {
    data,
    message: "Current user data retrieved successfully",
    statusCode: status.OK,
    success: true,
  });
});

export default { registerUser, loginUser, changePassword, getCurrentUser };
