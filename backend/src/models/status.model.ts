// status.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IStatus extends Document {
  user: mongoose.Types.ObjectId;

  text?: string;

  mediaUrl?: string;
  mediaPublicId?: string;
  mediaType?: "image" | "video";
  duration?: number; // seconds (only for video)

  viewers: mongoose.Types.ObjectId[];
  reactions: mongoose.Types.ObjectId[];

  expiresAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

const StatusSchema = new Schema<IStatus>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🔤 TEXT STATUS (optional)
    text: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // 🖼 / 🎥 MEDIA STATUS (optional)
    mediaUrl: String,
    mediaPublicId: String,

    mediaType: {
      type: String,
      enum: ["image", "video"],
    },

    duration: {
      type: Number,
      max: 60, // 🔥 video max 1 minute
    },

    viewers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    reactions: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

// 🔥 Auto-delete after expiry (single TTL index definition)
StatusSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Status = mongoose.model<IStatus>("Status", StatusSchema);

export default Status;
