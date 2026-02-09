import Notification from "../models/notification.model";
import { sendPushNotification } from "../utils/expo";
import { io } from "../utils/socket";
import User from "../models/user.model";

interface SendNotificationPayload {
  userId: string;
  title: string;
  body: string;
  type: "message" | "voice" | "system";
  data?: any;
}

export class NotificationService {
  /**
   * Send a notification:
   * 1. Persist it to the database
   * 2. Send push notification via Expo
   * 3. Emit socket event for real-time update
   */
  static async send(payload: SendNotificationPayload) {
    try {
      const { userId, title, body, type, data } = payload;

      // 1. Create and Save Notification in DB
      const notification = await Notification.create({
        user: userId,
        title,
        body,
        type,
        data,
        read: false,
      });

      // 2. Send Push Notification if user has a token
      const user = await User.findById(userId).select("pushToken");
      if (user?.pushToken) {
        await sendPushNotification({
          to: user.pushToken,
          title,
          body,
          data: { ...data, notificationId: notification._id },
        });
      }

      // 3. Emit Socket Event
      if (io) {
        io.to(`user:${userId}`).emit("new-notification", notification);
      }

      return notification;
    } catch (error) {
      console.error("❌ Error in NotificationService.send:", error);
      // We don't throw here to avoid failing the main request (like sending a message)
      // just because the notification failed.
    }
  }
}
