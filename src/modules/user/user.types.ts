import type { Role } from "./user.constant";

export type PublicUser = {
  _id: ObjectId;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
};

export type UserCredentials = {
  user: PublicUser;
  passwordHash: string;
};

export type TUser = PublicUser & {
  password: string;
  passwordUpdatedAt?: Date;
};

export type UserAuthState = PublicUser & {
  passwordUpdatedAt?: Date;
};

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role?: Role;
};

export type TUserResponse = Omit<PublicUser, "_id" | "createdAt" | "updatedAt"> & {
  _id: string;
  createdAt: string;
  updatedAt: string;
};
