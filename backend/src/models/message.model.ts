import mongoose, { Schema, type Document } from "mongoose";

export interface IMessage extends Document {
  chat: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;

  type: "text" | "image" | "video" | "voice";

  text?: string;

  content?: string; // Cloudinary secure_url
  contentPublicId?: string;

  duration?: number;

  replyTo?: mongoose.Types.ObjectId;

  isEdited: boolean;
  deleted: boolean;
  deletedAt?: Date;

  reactions: {
    emoji: string;
    users: mongoose.Types.ObjectId[];
  }[];

  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    chat: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["text", "image", "video", "voice"],
      default: "text",
    },

    text: {
      type: String,
      trim: true,
      default: "",
    },

    content: {
      type: String,
    },

    contentPublicId: {
      type: String,
    },

    duration: {
      type: Number,
    },

    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },

    isEdited: {
      type: Boolean,
      default: false,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    reactions: [
      {
        emoji: { type: String, required: true },
        users: [{ type: Schema.Types.ObjectId, ref: "User" }],
      },
    ],
  },
  { timestamps: true },
);

// indexes for faster queries
MessageSchema.index({ chat: 1, createdAt: 1 });

const Message = mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
