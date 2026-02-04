import type { Response } from "express";
import bcrypt from "bcryptjs";

import type { AuthRequest } from "../middlewares/auth.middleware";

import User from "../models/user.model";

import cloudinary from "../configs/cloudinary";
import { isValidStrongPassword } from "../utils/validStrongPassword";
import { io } from "../utils/socket";

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const users = await User.find({ _id: { $ne: userId } })
      .select("name email avatar")
      .limit(50);

    res.json(users);
  } catch (error) {
    console.log(`❌ Error in get users: ${error}`);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "❌ Unauthorized" });
    }

    if (!currentPassword || !newPassword || !confirmPassword)
      return res.status(400).json({ message: "❌ All fields are required" });

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "❌ Passwords do not match" });
    }

    if (newPassword === currentPassword) {
      return res.status(400).json({
        message: "❌ New password must be different from current password",
      });
    }

    const isStrongPassword = isValidStrongPassword(newPassword);
    if (!isStrongPassword)
      return res
        .status(400)
        .json({ message: "❌ New password is not strong enough" });

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "❌ User not found" });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ message: "❌ Current password is incorrect" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({ message: "✅ Password changed successfully" });
  } catch (error) {
    console.log(`❌ Error in change password: ${error}`);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { name, email } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "❌ Unauthorized" });
    }

    if (!name && !email)
      return res.status(400).json({ message: "❌ No data to update" });

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "❌ User not found" });
    }

    if (email) {
      // email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email))
        return res.status(400).json({ message: "❌ Invalid email format" });

      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== userId)
        return res.status(409).json({ message: "❌ Email already in use" });
    }

    user.name = name || user.name;
    user.email = email || user.email;

    await user.save();

    // Notify all connected clients about the user update
    io.emit("user-updated", {
      userId: user._id,
      name: user.name,
      avatar: user.avatar,
    });

    res.status(200).json({
      message: "✅ Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.log(`❌ Error in update profile: ${error}`);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProfileAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "❌ Unauthorized" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "❌ User not found" });

    if (!req.file)
      return res.status(400).json({ message: "❌ No file uploaded" });

    // delete previous avatar from cloudinary
    if (user.avatar) {
      try {
        const publicId = user.avatar.split("/").pop()?.split(".")[0];
        if (publicId) {
          await cloudinary.uploader.destroy(publicId.toString());
          console.log("✅ Successfully destroyed.");
        }
      } catch (error) {
        console.log(`❌ Error destroying avatar: ${error}`);
      }
    }

    // upload new avatar to cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "avatars",
      width: 150,
      height: 150,
      crop: "fill",
    });

    user.avatar = result.secure_url;
    await user.save();

    // Notify all connected clients about the user update
    io.emit("user-updated", {
      userId: user._id,
      name: user.name,
      avatar: user.avatar,
    });

    res
      .status(200)
      .json({ message: "✅ Avatar updated successfully", avatar: user.avatar });
  } catch (error) {
    console.log(`❌ Error in update profile avatar: ${error}`);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // clear user avatar from cloudinary
    if (user.avatar) {
      try {
        const publicId = user.avatar.split("/").pop()?.split(".")[0];
        if (publicId) {
          await cloudinary.uploader.destroy(publicId.toString());
          console.log("✅ Successfully destroyed.");
        }
      } catch (error) {
        console.log(`❌ Error destroying avatar: ${error}`);
      }
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "✅ User account deleted successfully" });
  } catch (error) {
    console.log(`❌ Error in delete Account: ${error}`);
    return res.status(500).json({ message: "Internal server error" });
  }
};
