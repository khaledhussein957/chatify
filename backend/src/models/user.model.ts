import mongoose, { Schema, type Document } from "mongoose";

export interface IUser extends Document {
  name?: string;
  email?: string;
  password?: string;
  bio?: string;
  avatar?: string;

  resetCode?: string;
  resetCodeExpiresAt?: Date;
  resetPasswordResendCount: number;
  resetPasswordRequestedAt?: Date;

  phone: string;
  verificationCode?: string;
  codeExpires?: Date;
  isVerified: boolean;
  deviceId?: string;

  // OTP rate limiting (5 OTPs per month)
  otpSentCount: number;
  otpSentMonth?: Date; // Track the month for OTP count

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema<IUser>(
  {
    name: { type: String, required: false },
    email: { type: String, required: false },
    password: { type: String, required: false },
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

    phone: { type: String, required: true, unique: true },
    verificationCode: { type: String, required: false },
    codeExpires: { type: Date, required: false },
    isVerified: { type: Boolean, default: false },
    deviceId: { type: String, required: false },

    // OTP rate limiting
    otpSentCount: { type: Number, default: 0 },
    otpSentMonth: { type: Date, required: false },
  },
  { timestamps: true },
);

const User = mongoose.model<IUser>("User", UserSchema);

export default User;
