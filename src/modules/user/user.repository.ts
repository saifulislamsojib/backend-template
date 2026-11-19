import User from "./user.model";
import type {
  CreateUserInput,
  PublicUser,
  TUser,
  UserAuthState,
  UserCredentials,
} from "./user.types";

// Explicit allowlist: persistence metadata and secrets never enter public projections.
const publicUser = (user: PublicUser): PublicUser => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const credentials = (
  user: (PublicUser & Pick<TUser, "password">) | null,
): UserCredentials | null => {
  return user ? { user: publicUser(user), passwordHash: user.password } : null;
};

const existsByEmail = async (email: string): Promise<boolean> => {
  return Boolean(await User.exists({ email }));
};

const createUser = async (input: CreateUserInput): Promise<PublicUser> => {
  const user = await User.create(input);
  return publicUser(user.toObject());
};

const findCredentialsByEmail = async (email: string): Promise<UserCredentials | null> => {
  return credentials(await User.findOne({ email }).select("+password -__v").lean());
};

const findCredentialsById = async (id: string | ObjectId): Promise<UserCredentials | null> => {
  return credentials(await User.findById(id).select("+password -__v").lean());
};

const findAuthStateById = async (id: string | ObjectId): Promise<UserAuthState | null> => {
  return User.findById(id).select("+passwordUpdatedAt -__v").lean();
};

const updatePasswordIfCurrent = async (
  id: string | ObjectId,
  expectedPasswordHash: string,
  passwordHash: string,
): Promise<PublicUser | null> => {
  const user = await User.findOneAndUpdate(
    { _id: id, password: expectedPasswordHash },
    { $set: { password: passwordHash, passwordUpdatedAt: new Date() } },
    { returnDocument: "after", runValidators: true },
  )
    .select("-__v")
    .lean();
  return user ? publicUser(user) : null;
};

export default {
  existsByEmail,
  createUser,
  findCredentialsByEmail,
  findCredentialsById,
  findAuthStateById,
  updatePasswordIfCurrent,
};
