import axios from "axios";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface PushPayload {
  to: string | string[];
  title: string;
  body: string;
  data?: any;
  sound?: "default" | null;
  badge?: number;
}

/**
 * Sends a push notification via Expo Push API
 */
export const sendPushNotification = async (payload: PushPayload) => {
  try {
    const { to, title, body, data, sound = "default", badge } = payload;

    // Filter out invalid or empty tokens
    const tokens = Array.isArray(to) ? to.filter((t) => !!t) : to ? [to] : [];
    if (tokens.length === 0) return;

    console.log(
      `📡 Sending push notification to ${tokens.length} recipients: ${title}`,
    );

    const response = await axios.post(
      EXPO_PUSH_URL,
      {
        to: tokens.length === 1 ? tokens[0] : tokens,
        title,
        body,
        data,
        sound,
        badge,
      },
      {
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  } catch (error: any) {
    console.error(
      "❌ Error sending push notification:",
      error?.response?.data || error.message,
    );
  }
};
