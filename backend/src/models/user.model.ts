import mongoose, { Schema, type Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  bio?: string;
  avatar?: string;

  resetCode?: string;
  resetCodeExpiresAt?: Date;
  resetPasswordResendCount: number;
  resetPasswordRequestedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    bio: { type: String, required: false },
    avatar: { type: String, required: false },

    resetCode: { type: String, required: false },
    resetCodeExpiresAt: { type: Date, required: false },
    resetPasswordResendCount: {
      type: Number,
      default: 0,
      max: 3,
    },
    resetPasswordRequestedAt: Date,
  },
  { timestamps: true },
);

const User = mongoose.model<IUser>("User", UserSchema);

export default User;
