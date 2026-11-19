import { model, Schema } from "mongoose";
import { userRoles } from "./user.constant";
import type { TUser } from "./user.types";

const userSchema = new Schema<TUser>(
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
      lowercase: true,
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

const User = model<TUser>("User", userSchema);

export default User;
