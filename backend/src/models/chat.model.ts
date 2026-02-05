import mongoose, { Schema, type Document } from "mongoose";

export interface IChat extends Document {
  participants: mongoose.Types.ObjectId[];

  isGroupChat: boolean;
  name?: string;
  groupImage?: string;
  admins: mongoose.Types.ObjectId[];

  lastMessage?: mongoose.Types.ObjectId;
  lastMessageAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    isGroupChat: {
      type: Boolean,
      default: false,
    },

    name: {
      type: String,
      trim: true,
    },

    groupImage: {
      type: String,
    },

    admins: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// ✅ INDEXES (defined AFTER schema creation)
ChatSchema.index({ participants: 1 });
ChatSchema.index({ isGroupChat: 1 });
ChatSchema.index({ lastMessageAt: -1 });

const Chat = mongoose.model<IChat>("Chat", ChatSchema);

export default Chat;
