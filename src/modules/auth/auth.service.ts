import AppError from "@/errors/AppError";
import userRepository from "@/modules/user/user.repository";
import { status } from "http-status";
import { compareHashedText, createJWT, hashText } from "./auth.utils";
import type { ChangePasswordPayload, LoginPayload, RegisterPayload } from "./auth.validation";

const DUMMY_HASH = "$2b$10$e7V/4X/t18f.5Ew1xV9.uO3zB9h5k.3y9jH.x4y.5z6a7b8c9d0e1";

const registerUser = async (payload: RegisterPayload) => {
  const { email } = payload;

  // check user is already registered or not
  const isExist = await userRepository.existsByEmail(email);
  if (isExist) {
    throw new AppError(status.BAD_REQUEST, "The User already exists by the email");
  }

  // Now create the user
  const hashedPassword = await hashText(payload.password);
  const user = await userRepository.createUser({
    name: payload.name,
    email,
    password: hashedPassword,
  });

  // create jwt token
  const token = createJWT({ email: user.email, _id: user._id, role: user.role });

  return {
    token,
    user,
  };
};

const loginUser = async (payload: LoginPayload) => {
  const { email, password } = payload;

  // check the user found or not
  const credentials = await userRepository.findCredentialsByEmail(email);
  if (!credentials) {
    await compareHashedText(password, DUMMY_HASH);
    throw new AppError(status.UNAUTHORIZED, "Invalid email or password");
  }

  // check the user password
  if (!(await compareHashedText(password, credentials.passwordHash))) {
    throw new AppError(status.UNAUTHORIZED, "Invalid email or password");
  }

  const { user } = credentials;
  const token = createJWT({ email: user.email, _id: user._id, role: user.role });
  return { token, user };
};

const changePassword = async (userId: string | ObjectId, payload: ChangePasswordPayload) => {
  const { currentPassword, newPassword } = payload;

  if (currentPassword === newPassword) {
    throw new AppError(
      status.BAD_REQUEST,
      "Current password and new password cannot be the same",
      null,
    );
  }

  const credentials = await userRepository.findCredentialsById(userId);

  if (!credentials) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  // check currentPassword
  if (!(await compareHashedText(currentPassword, credentials.passwordHash))) {
    throw new AppError(status.UNAUTHORIZED, "Current password is not matched");
  }

  // hash password
  const hashedPassword = await hashText(newPassword);

  const user = await userRepository.updatePasswordIfCurrent(
    userId,
    credentials.passwordHash,
    hashedPassword,
  );
  if (!user) {
    throw new AppError(status.BAD_REQUEST, "Password change failed");
  }

  // create jwt token
  const token = createJWT({ email: user.email, _id: user._id, role: user.role });

  return {
    token,
    user,
  };
};

export default { registerUser, loginUser, changePassword };
