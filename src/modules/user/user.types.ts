import type { ObjectId } from 'mongoose';
import { userRoles } from './user.constant';

export type Role = (typeof userRoles)[number];

type TUser = {
  _id: ObjectId;
  name: string;
  email: string;
  password: string;
  role: Role;
  passwordUpdatedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  __v?: number;
};

export type TUserResponse = Omit<TUser, '_id' | 'passwordUpdatedAt' | 'createdAt' | 'updatedAt'> & {
  _id: string;
  passwordUpdatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export default TUser;
