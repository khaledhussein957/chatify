import { Request, Response } from "express";
import bcrypt from "bcryptjs";

import User from "../models/user.model";

import { AuthRequest } from "../middlewares/auth.middleware";

import { isValidStrongPassword } from "../utils/validStrongPassword";
import { generateToken } from "../utils/generateToken";

import {
  forgotPasswordEmail,
  sendPasswordResetSuccessEmail,
} from "../emails/emailHandler";
import { randomInt } from "crypto";

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.log(`❌ Error in get Me: ${error}`);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "❌ All fields are required" });

    // email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ message: "❌ Invalid email format" });

    const isStrongPassword = isValidStrongPassword(password);
    if (!isStrongPassword)
      return res
        .status(400)
        .json({ message: "❌ Password is not strong enough" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ message: "❌ User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // first letter of name capitalized as avatar
    const avatar = name.charAt(0).toUpperCase();

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      avatar,
    });

    await newUser.save();

    const token = generateToken(newUser._id.toString());

    res.status(201).json({
      message: "✅ User registered successfully",
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        bio: newUser.bio,
        avatar: newUser.avatar,
      },
    });
  } catch (error) {
    console.log(`❌ Error in register: ${error}`);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "❌ All fields are required" });

    // email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ message: "❌ Invalid email format" });

    const user = await User.findOne({ email });

    const isPasswordValid = user
      ? await bcrypt.compare(password, user.password)
      : false;
    if (!user || !isPasswordValid)
      return res.status(401).json({ message: "❌ Invalid credentials" });

    const token = generateToken(user._id.toString());

    res.status(200).json({
      message: "✅ User logged in successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.log(`❌ Error in login: ${error}`);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// --- Forgot Password ---
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ message: "❌ Email field is required" });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ message: "❌ Invalid email format" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "❌ User does not exist" });

    const now = new Date();

    // reset counter if more than 1 hour passed
    if (
      user.resetPasswordRequestedAt &&
      now.getTime() - user.resetPasswordRequestedAt.getTime() > 60 * 60 * 1000
    ) {
      user.resetPasswordResendCount = 0;
      user.resetPasswordRequestedAt = undefined;
    }

    if (user.resetPasswordResendCount >= 3) {
      return res
        .status(429)
        .json({ message: "❌ Maximum resend attempts reached" });
    }

    // first send after reset → set timestamp
    if (user.resetPasswordResendCount === 0) {
      user.resetPasswordRequestedAt = now;
    }

    user.resetPasswordResendCount += 1;

    const resetCode = randomInt(100000, 1000000).toString();
    const resetCodeHash = await bcrypt.hash(resetCode, 10);

    user.resetCode = resetCodeHash;
    user.resetCodeExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    await user.save();

    await forgotPasswordEmail(user.name, user.email, resetCode);

    res.status(200).json({ message: "✅ Reset code sent to email" });
  } catch (error) {
    console.log(`❌ Error in forgot password: ${error}`);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// --- Resend Code ---
export const resendCode = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ message: "❌ Email field is required" });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ message: "❌ Invalid email format" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "❌ User does not exist" });

    const now = new Date();

    // reset counter if more than 1 hour passed
    if (
      user.resetPasswordRequestedAt &&
      now.getTime() - user.resetPasswordRequestedAt.getTime() > 60 * 60 * 1000
    ) {
      user.resetPasswordResendCount = 0;
      user.resetPasswordRequestedAt = undefined;
      user.resetCodeExpiresAt = undefined;
    }

    // Check if a code already exists and is still valid
    if (user.resetCodeExpiresAt && user.resetCodeExpiresAt > now) {
      const secondsLeft = Math.ceil(
        (user.resetCodeExpiresAt.getTime() - now.getTime()) / 1000,
      );
      return res.status(400).json({
        message: `❌ Reset code is still valid. Try again in ${secondsLeft} seconds.`,
      });
    }

    if (user.resetPasswordResendCount >= 3) {
      return res
        .status(429)
        .json({ message: "❌ Maximum resend attempts reached" });
    }

    if (!user.resetPasswordRequestedAt) {
      user.resetPasswordRequestedAt = now;
      user.resetPasswordResendCount = 0;
    }

    user.resetPasswordResendCount += 1;

    // Generate new reset code
    const resetCode = randomInt(100000, 1000000).toString();
    const resetCodeHash = await bcrypt.hash(resetCode, 10);

    user.resetCode = resetCodeHash;
    user.resetCodeExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    await user.save();

    await forgotPasswordEmail(user.name, user.email, resetCode);

    res.status(200).json({ message: "✅ Reset code resent to email" });
  } catch (error) {
    console.log(`❌ Error in resend code: ${error}`);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// --- Reset Password ---
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, resetCode, newPassword, confirmPassword } = req.body;
    if (!email || !resetCode || !newPassword || !confirmPassword)
      return res.status(400).json({ message: "❌ All fields are required" });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ message: "❌ Invalid email format" });

    if (newPassword !== confirmPassword)
      return res.status(400).json({ message: "❌ Passwords do not match" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "❌ User does not exist" });

    const isResetCodeValid = user.resetCode
      ? await bcrypt.compare(resetCode, user.resetCode)
      : false;
    if (!isResetCodeValid)
      return res.status(400).json({ message: "❌ Invalid reset code" });

    if (!user.resetCodeExpiresAt || user.resetCodeExpiresAt < new Date())
      return res.status(400).json({ message: "❌ Reset code has expired" });

    if (!isValidStrongPassword(newPassword))
      return res
        .status(400)
        .json({ message: "❌ Password is not strong enough" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // clear reset code and resend counter
    user.resetCode = undefined;
    user.resetCodeExpiresAt = undefined;
    user.resetPasswordResendCount = 0;
    user.resetPasswordRequestedAt = undefined;

    await user.save();
    await sendPasswordResetSuccessEmail(user.email);

    res.status(200).json({ message: "✅ Password reset successfully" });
  } catch (error) {
    console.log(`❌ Error in reset password: ${error}`);
    return res.status(500).json({ message: "Internal server error" });
  }
};
