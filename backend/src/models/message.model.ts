import mongoose, { Schema, type Document } from "mongoose";

export interface IMessage extends Document {
  chat: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  text: string;
  content?: string; // like image, video, etc.

  deleted: boolean;
  deletedAt: Date;

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
    text: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    content: {
      type: String,
      required: false,
    },

    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

// indexes for faster queries
MessageSchema.index({ chat: 1, createdAt: 1 }); // oldest one first
// 1 - asc
// -1 -> desc

const Message = mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
