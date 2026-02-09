import axios from "axios";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_RECEIPT_URL = "https://exp.host/--/api/v2/push/getReceipts";

interface PushPayload {
  to: string | string[];
  title: string;
  body: string;
  data?: any;
  sound?: "default" | null;
  badge?: number;
  channelId?: string;
}

const isExpoPushToken = (token: string) =>
  typeof token === "string" && token.startsWith("ExponentPushToken");

/**
 * Chunk an array into smaller arrays of a given size.
 */
const chunkArray = <T>(arr: T[], size: number) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );

/**
 * Sends push notifications via Expo Direct API.
 * Follows Expo's reliability guidelines:
 * 1. Chunks notifications (max 100 per request).
 * 2. Handles push tickets.
 * 3. Logs errors for debugging.
 */
export const sendPushNotification = async (payload: PushPayload) => {
  try {
    const {
      to,
      title,
      body,
      data,
      sound = "default",
      badge,
      channelId,
    } = payload;

    const allTokens = Array.isArray(to)
      ? to.filter(isExpoPushToken)
      : to && isExpoPushToken(to)
        ? [to]
        : [];

    if (allTokens.length === 0) return;

    // Expo recommends chunks of 100 or less
    const chunks = chunkArray(allTokens, 100);
    const tickets: any[] = [];

    for (const chunk of chunks) {
      try {
        const response = await axios.post(
          EXPO_PUSH_URL,
          chunk.map((token) => ({
            to: token,
            title,
            body,
            data,
            sound,
            badge,
            channelId,
          })),
          {
            headers: {
              Accept: "application/json",
              "Accept-encoding": "gzip, deflate",
              "Content-Type": "application/json",
            },
            timeout: 10000, // 10s timeout
          },
        );

        if (response.data && response.data.data) {
          tickets.push(...response.data.data);
        }

        if (response.data && response.data.errors) {
          console.error("⚠️ Expo push response errors:", response.data.errors);
        }
      } catch (chunkError: any) {
        console.error(
          "❌ Expo chunk send error:",
          chunkError?.response?.data || chunkError.message,
        );
      }
    }

    // Process tickets for immediate errors (like DeviceNotRegistered)
    tickets.forEach((ticket, index) => {
      if (ticket.status === "error") {
        console.error(
          `❌ Push ticket handled error for token: ${allTokens[index]}`,
          ticket.message,
          ticket.details,
        );
        // NOTE: In a more advanced implementation, we could remove the invalid token from the DB here
      }
    });

    return tickets;
  } catch (error: any) {
    console.error(
      "❌ Expo push critical error:",
      error?.response?.data || error.message,
    );
  }
};

/**
 * Checks push receipts for a list of ticket IDs.
 * Recommended to be called ~15 minutes after sending.
 */
export const getPushReceipts = async (ticketIds: string[]) => {
  try {
    if (!ticketIds || ticketIds.length === 0) return;

    const chunks = chunkArray(ticketIds, 100);
    const receipts: any = {};

    for (const chunk of chunks) {
      const response = await axios.post(
        EXPO_RECEIPT_URL,
        { ids: chunk },
        {
          headers: {
            Accept: "application/json",
            "Accept-encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data && response.data.data) {
        Object.assign(receipts, response.data.data);
      }
    }

    return receipts;
  } catch (error: any) {
    console.error(
      "❌ Expo receipt fetch error:",
      error?.response?.data || error.message,
    );
  }
};
