import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";

import User from "../models/user.model";

import { AuthRequest } from "../middlewares/auth.middleware";

import { isValidStrongPassword } from "../utils/validStrongPassword";
import { generateToken } from "../utils/generateToken";
import { validatePhoneNumber } from "../utils/phoneValidate";
import sendOtp from "../utils/otp";
import { generateStrongPassword } from "../utils/passwordGenerator";
import { logoutOtherDevices } from "../utils/socket";

import {
  forgotPasswordEmail,
  sendPasswordResetSuccessEmail,
} from "../emails/emailHandler";

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

// Helper: generate 6-digit code
const generateCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const register = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res
        .status(400)
        .json({ success: false, message: "Phone number is required" });
    }

    let user = await User.findOne({ phone });

    const code = generateCode();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    // validate phone number
    const validation = validatePhoneNumber(phone);
    if (!validation?.valid) {
      return res
        .status(400)
        .json({ success: false, message: validation?.message });
    }

    // Check OTP rate limiting (5 OTPs per month)
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    if (user) {
      // Reset counter if it's a new month
      if (
        !user.otpSentMonth ||
        user.otpSentMonth.getMonth() !== now.getMonth() ||
        user.otpSentMonth.getFullYear() !== now.getFullYear()
      ) {
        user.otpSentCount = 0;
        user.otpSentMonth = currentMonth;
      }

      // Check if user has exceeded monthly limit
      if (user.otpSentCount >= 5) {
        return res.status(429).json({
          success: false,
          message:
            "Monthly OTP limit reached (5 OTPs per month). Please try again next month.",
        });
      }
    }

    if (!user) {
      user = await User.create({
        phone,
        verificationCode: code,
        codeExpires: expires,
        otpSentCount: 1,
        otpSentMonth: currentMonth,
      });
    } else {
      // Check if previous code is still valid
      if (user.codeExpires && user.codeExpires > new Date()) {
        const secondsLeft = Math.ceil(
          (user.codeExpires.getTime() - Date.now()) / 1000,
        );
        return res.status(400).json({
          success: false,
          message: `Verification code is still valid. Please wait ${secondsLeft} seconds before requesting a new code.`,
        });
      }

      user.verificationCode = code;
      user.codeExpires = expires;
      user.otpSentCount += 1;
      await user.save();
    }

    // Send OTP via SMS
    const smsMessage = `Your verification code of Chatify is ${code}`;
    try {
      const smsResponse = await sendOtp({ smsMessage, phoneNumber: phone });
      if (!smsResponse.status) {
        return res
          .status(500)
          .json({ success: false, message: "Failed to send OTP" });
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      return res
        .status(500)
        .json({ success: false, message: "Error sending OTP" });
    }

    res.status(200).json({
      success: true,
      message: "Verification code sent",
      userId: user._id,
    });
  } catch (error) {
    console.log("Error in register:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const verifyCode = async (req: Request, res: Response) => {
  try {
    const { phone, code, deviceId } = req.body;
    if (!phone || !code)
      return res.status(400).json({ message: "Phone and code required" });

    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.codeExpires || user.codeExpires < new Date()) {
      return res.status(400).json({ message: "Code expired" });
    }
    if (user.verificationCode !== code) {
      return res.status(400).json({ message: "Invalid code" });
    }

    // Logout previous device and set new deviceId
    if (deviceId) {
      user.deviceId = deviceId;
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.codeExpires = undefined;
    await user.save();

    // Force logout other devices if a deviceId is set
    if (user.deviceId) {
      logoutOtherDevices(user._id.toString(), user.deviceId);
    }

    // generate token
    const token = generateToken(user._id.toString());

    return res.status(200).json({
      message: "Phone verified",
      token,
      profileCompleted: !!(user.name && user.email),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.log("Error in verifyCode:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: "Phone required" });

    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Reject if a valid (non-expired) code already exists
    if (
      user.verificationCode &&
      user.codeExpires &&
      user.codeExpires > new Date()
    ) {
      const secondsLeft = Math.ceil(
        (user.codeExpires.getTime() - Date.now()) / 1000,
      );
      return res.status(400).json({
        message: `Verification code is still valid. Please wait ${secondsLeft} seconds before requesting a new code.`,
      });
    }

    const code = generateCode();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    user.verificationCode = code;
    user.codeExpires = expires;
    await user.save();

    // Send OTP via SMS
    const smsMessage = `Your verification code of Chatify is ${code}`;
    try {
      const smsResponse = await sendOtp({ smsMessage, phoneNumber: phone });
      if (!smsResponse.status) {
        return res
          .status(500)
          .json({ success: false, message: "Failed to send OTP" });
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      return res
        .status(500)
        .json({ success: false, message: "Error sending OTP" });
    }

    res.status(200).json({
      success: true,
      message: "Verification code sent",
      userId: user._id,
    });
  } catch (error) {
    console.log("Error in resendOtp:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, deviceId } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "❌ All fields are required" });

    // email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ message: "❌ Invalid email format" });

    const user = await User.findOne({ email });

    const isPasswordValid = user
      ? await bcrypt.compare(password, user.password!)
      : false;
    if (!user || !isPasswordValid)
      return res.status(401).json({ message: "❌ Invalid credentials" });

    // Update deviceId if provided
    if (deviceId) {
      user.deviceId = deviceId;
      await user.save();
      logoutOtherDevices(user._id.toString(), deviceId);
    }

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
    return res.status(500).json({ message: "Server error" });
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

    await forgotPasswordEmail(user.name!, user.email!, resetCode);

    res.status(200).json({ message: "✅ Reset code sent to email" });
  } catch (error) {
    console.log(`❌ Error in forgot password: ${error}`);
    return res.status(500).json({ message: "Server error" });
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

    await forgotPasswordEmail(user.name!, user.email!, resetCode);

    res.status(200).json({ message: "✅ Reset code resent to email" });
  } catch (error) {
    console.log(`❌ Error in resend code: ${error}`);
    return res.status(500).json({ message: "Server error" });
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
    await sendPasswordResetSuccessEmail(user.email!);

    res.status(200).json({ message: "✅ Password reset successfully" });
  } catch (error) {
    console.log(`❌ Error in reset password: ${error}`);
    return res.status(500).json({ message: "Server error" });
  }
};
