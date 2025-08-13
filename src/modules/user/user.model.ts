import { compareHashedText, hashText } from '@/modules/auth/auth.utils';
import { model, Schema, type Model } from 'mongoose';
import { userRoles } from './user.constant';
import type { TUser } from './user.types';

type UserMethods = {
  isValidPassword: (password: string) => Promise<boolean>;
};

type UserModel = Model<TUser, unknown, UserMethods>;

const userSchema = new Schema<TUser, UserModel, UserMethods>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      index: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      select: 0,
    },
    role: {
      type: String,
      enum: userRoles,
      default: userRoles[0],
    },
    passwordUpdatedAt: {
      type: Date,
      select: 0,
    },
  },
  { timestamps: true },
);

userSchema.pre('save', async function preUserSave() {
  this.password = await hashText(this.password);
});

userSchema.method('isValidPassword', function isValidPassword(password: string) {
  return compareHashedText(password, this.password);
});

const User = model<TUser, UserModel>('User', userSchema);

export default User;
