import type { ObjectId } from 'mongoose';
import type { Role } from './user.constant.js';

export type TUser = {
  _id: ObjectId;
  name: string;
  email: string;
  password: string;
  role: Role;
  passwordUpdatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
};

export type TUserResponse = Omit<TUser, '_id' | 'passwordUpdatedAt' | 'createdAt' | 'updatedAt'> & {
  _id: string;
  passwordUpdatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};
