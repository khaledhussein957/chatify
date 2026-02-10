import type { Response } from "express";
import bcrypt from "bcryptjs";

import type { AuthRequest } from "../middlewares/auth.middleware";

import User from "../models/user.model";
import Chat from "../models/chat.model";
import Message from "../models/message.model";
import Status from "../models/status.model";

import cloudinary from "../configs/cloudinary";

import { isValidStrongPassword } from "../utils/validStrongPassword";
import { io, forceDisconnectUser } from "../utils/socket";
import { validatePhoneNumber } from "../utils/phoneValidate";

import {
  sendEmailLinkedSuccessEmail,
  sendWelcomePasswordEmail,
} from "../emails/emailHandler";
import { generateStrongPassword } from "../utils/passwordGenerator";

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

    if (!user.password) {
      return res.status(400).json({
        message:
          "❌ Password not set. Use a different method to update your credentials.",
      });
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

export const changePhoneNumber = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { oldPhone, newPhone } = req.body;
    if (!oldPhone || !newPhone) {
      return res.status(400).json({
        success: false,
        message: "Old and new phone numbers are required",
      });
    }

    const isCorrectPhone = await validatePhoneNumber(oldPhone);
    if (!isCorrectPhone?.valid) {
      return res
        .status(400)
        .json({ success: false, message: "Old phone number is incorrect" });
    }

    const isCorrectNewPhone = await validatePhoneNumber(newPhone);
    if (!isCorrectNewPhone?.valid) {
      return res
        .status(400)
        .json({ success: false, message: "New phone number is incorrect" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.phone !== oldPhone) {
      return res
        .status(400)
        .json({ success: false, message: "Old phone number does not match" });
    }

    const existingUser = await User.findOne({ phone: newPhone });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "New phone number already in use" });
    }

    user.phone = newPhone;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Phone number updated successfully" });
  } catch (error) {
    console.log("Error in changePhoneNumber:", error);
    res.status(500).json({ success: false, message: "Server error" });
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

export const updateProfile = async (req: AuthRequest, res: Response) => {
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
    if (error.code === 11000) {
      return res.status(409).json({ message: "❌ Email already in use" });
    }
    console.error("❌ Error in update profile:", error);
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

    // 1. Clear user avatar from cloudinary
    if (user.avatar) {
      try {
        const publicId = user.avatar.split("/").pop()?.split(".")[0];
        if (publicId) {
          await cloudinary.uploader.destroy(`avatars/${publicId}`);
          console.log("✅ Avatar destroyed.");
        }
      } catch (error) {
        console.log(`❌ Error destroying avatar: ${error}`);
      }
    }

    // 2. Chat & Group Cleanup
    const userChats = await Chat.find({ participants: userId });

    for (const chat of userChats) {
      if (!chat.isGroupChat) {
        // 1-on-1 Chat: Delete all messages and the chat
        // Identify other participant to notify them
        const otherParticipant = chat.participants.find(
          (p) => p.toString() !== userId,
        );
        if (otherParticipant) {
          io.to(`user:${otherParticipant.toString()}`).emit("chat-deleted", {
            chatId: chat._id,
          });
        }

        await Message.deleteMany({ chat: chat._id });
        await Chat.findByIdAndDelete(chat._id);
        console.log(`✅ 1-on-1 Chat ${chat._id} deleted.`);
      } else {
        // Group Chat: Handle admin transfer and member removal
        // Filter out the user from participants and admins
        chat.participants = chat.participants.filter(
          (p) => p.toString() !== userId,
        );
        chat.admins = chat.admins.filter((a) => a.toString() !== userId);

        if (chat.participants.length === 0) {
          // Last member: Delete group and messages
          await Message.deleteMany({ chat: chat._id });
          await Chat.findByIdAndDelete(chat._id);
          console.log(`✅ Empty Group ${chat._id} deleted.`);
        } else {
          // Transfer admin if user was the only admin
          if (chat.admins.length === 0) {
            chat.admins.push(chat.participants[0]);
          }
          await chat.save();

          // Notify remaining members
          io.to(`chat:${chat._id}`).emit("user-left", {
            userId,
            chatId: chat._id,
            wasDeleted: true,
          });
          console.log(
            `✅ User removed from Group ${chat._id}. Admin transferred if needed.`,
          );
        }
      }
    }

    // 3. Status Cleanup
    // Delete all statuses sent by this user
    await Status.deleteMany({ user: userId });
    // Remove user from viewers of other statuses
    await Status.updateMany(
      { viewers: userId },
      { $pull: { viewers: userId } },
    );
    console.log("✅ Statuses cleaned up.");

    // 4. Metadata Synchronization (Sync lastMessage before purging messages)
    const userMessageIds = await Message.find({ sender: userId }).distinct(
      "_id",
    );
    const affectedChats = await Chat.find({
      lastMessage: { $in: userMessageIds },
    });

    for (const chat of affectedChats) {
      // Find the most recent message that is NOT from the deleted user
      const newLastMsg = await Message.findOne({
        chat: chat._id,
        sender: { $ne: userId },
      }).sort({ createdAt: -1 });

      await Chat.findByIdAndUpdate(chat._id, {
        lastMessage: newLastMsg ? newLastMsg._id : null,
        lastMessageAt: newLastMsg ? newLastMsg.createdAt : chat.createdAt,
      });
    }
    console.log("✅ Chat metadata synchronized.");

    // 5. Message Purge (Even in remaining groups)
    await Message.deleteMany({ sender: userId });
    console.log("✅ User messages purged.");

    // 6. Force socket disconnection
    forceDisconnectUser(userId);

    // 7. Final Account Deletion
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      message: "✅ User account and all associated data deleted successfully",
    });
  } catch (error) {
    console.log(`❌ Error in delete Account: ${error}`);
    return res.status(500).json({ message: "Internal server error" });
  }
};
