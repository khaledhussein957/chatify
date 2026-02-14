import { Request, Response } from "express";

import User from "../models/user.model";

import { AuthRequest } from "../middlewares/auth.middleware";

import { generateToken } from "../utils/generateToken";
import { isOtpSupported, validatePhoneNumber } from "../utils/phoneValidate";
import sendOtp from "../utils/otp";
import { io, logoutOtherDevices } from "../utils/socket";

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
    const validation = await validatePhoneNumber(phone);
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

    // Check if operator supports OTP and handle bypass
    if (!isOtpSupported(phone)) {
      const v = await validatePhoneNumber(phone);
      const operator = v?.operator || "This network";
      return res.status(200).json({
        success: true,
        message: `OTP service unavailable for ${operator}. Use code: ${code}.`,
        userId: user._id,
      });
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
      userExists: !!(user.name || user.email),
      user:
        user.name || user.email
          ? {
              name: user.name,
              email: user.email,
              avatar: user.avatar,
            }
          : undefined,
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

const validateName = (name: string | undefined): string | null => {
  if (name !== undefined) {
    const trimmed = name.trim();
    if (!trimmed) return "❌ Name cannot be empty";
    return null;
  }
  return null;
};

const validateEmail = async (
  email: string | undefined,
  userId: string,
): Promise<string | null> => {
  if (email !== undefined) {
    const trimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) return "❌ Invalid email format";

    const existingUser = await User.findOne({
      email: trimmed,
      _id: { $ne: userId },
    });
    if (existingUser) return "❌ Email already in use";
  }
  return null;
};

export const completeProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    let { name, email } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "❌ Unauthorized" });
    }

    if (name === undefined && email === undefined) {
      return res.status(400).json({ message: "❌ No data to update" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "❌ User not found" });
    }

    const nameError = validateName(name);
    if (nameError) return res.status(400).json({ message: nameError });

    const emailError = await validateEmail(email, userId);
    if (emailError) {
      const status = emailError.includes("in use") ? 409 : 400;
      return res.status(status).json({ message: emailError });
    }

    if (name !== undefined) user.name = name.trim();
    if (email !== undefined) user.email = email.trim().toLowerCase();

    await user.save();

    io.emit("user-updated", {
      userId: user._id,
      name: user.name,
      avatar: user.avatar,
    });

    return res.status(200).json({
      message: "✅ Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
      },
    });
  } catch (error: any) {
    // Handle duplicate key error just in case
    if (error.code === 11000) {
      return res.status(409).json({ message: "❌ Email already in use" });
    }

    console.error("❌ Error in update profile:", error);
    return res.status(500).json({ message: "Internal server error" });
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

    // Check if operator supports OTP and handle bypass
    if (!isOtpSupported(phone)) {
      const v = await validatePhoneNumber(phone);
      const operator = v?.operator || "This network";
      return res.status(200).json({
        success: true,
        message: `OTP service unavailable for ${operator}. Use code: ${code}.`,
        userId: user._id,
      });
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
    console.log("Error in resendOtp:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
