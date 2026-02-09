import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  user: mongoose.Types.ObjectId; // receiver
  title: string;
  body: string;

  type: "message" | "voice" | "system";

  data?: {
    chatId?: mongoose.Types.ObjectId;
    messageId?: mongoose.Types.ObjectId;
    senderId?: mongoose.Types.ObjectId;
  };

  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    body: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["message", "voice", "system"],
      default: "message",
    },

    data: {
      chatId: { type: Schema.Types.ObjectId, ref: "Chat" },
      messageId: { type: Schema.Types.ObjectId, ref: "Message" },
      senderId: { type: Schema.Types.ObjectId, ref: "User" },
    },

    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// fast unread lookup
NotificationSchema.index({ user: 1, read: 1 });

const Notification = mongoose.model<INotification>(
  "Notification",
  NotificationSchema,
);

export default Notification;
