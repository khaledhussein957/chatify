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

const isExpoPushToken = (token: string) =>
  typeof token === "string" && token.startsWith("ExponentPushToken");

const chunkArray = <T>(arr: T[], size: number) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );

export const sendPushNotification = async (payload: PushPayload) => {
  try {
    const { to, title, body, data, sound = "default", badge } = payload;

    const tokens = Array.isArray(to)
      ? to.filter(isExpoPushToken)
      : to && isExpoPushToken(to)
        ? [to]
        : [];

    if (tokens.length === 0) return;

    const chunks = chunkArray(tokens, 100);

    for (const chunk of chunks) {
      await axios.post(
        EXPO_PUSH_URL,
        {
          to: chunk,
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
    }
  } catch (error: any) {
    console.error(
      "❌ Expo push error:",
      error?.response?.data || error.message,
    );
  }
};
