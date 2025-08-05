import { model, Schema, type Model } from 'mongoose';
import { compareHashedText, hashText } from '../auth/auth.utils.js';
import { userRoles } from './user.constant.js';
import type { TUser } from './user.types.js';

interface IUserMethods {
  isValidPassword(password: string): Promise<boolean>;
}

type UserModel = Model<TUser, unknown, IUserMethods>;

const userSchema = new Schema<TUser, UserModel, IUserMethods>(
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
      trim: true,
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
