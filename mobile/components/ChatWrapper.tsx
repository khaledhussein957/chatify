import { Chat, OverlayProvider, useCreateChatClient } from "stream-chat-expo";
import { FullScreenLoader } from "./FullScreenLoader";
import { useAuthStore } from "@/store/auth";
import { User } from "@/types";

import * as Sentry from "@sentry/react-native";

const STREAM_API_KEY = process.env.EXPO_PUBLIC_STREAM_API_KEY!;
const API_URL = process.env.EXPO_PUBLIC_API_URL!;

// Placeholder theme
const studyBuddyTheme = {};

const ChatClient = ({
  children,
  user,
  token,
}: {
  children: React.ReactNode;
  user: User;
  token: string;
}) => {
  const tokenProvider = async () => {
    try {
      const response = await fetch(`${API_URL}/stream/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user._id }),
      });
      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error("Failed to get Stream chat token", error);
      Sentry.captureException(error, {
        extra: { userId: user._id, hook: "tokenProvider" },
      });
    }
  };

  const chatClient = useCreateChatClient({
    apiKey: STREAM_API_KEY,
    userData: {
      id: user._id,
      name: user.name ?? "Guest",
      image: user.avatar,
    },
    tokenOrProvider: tokenProvider,
  });

  if (!chatClient) return <FullScreenLoader message="Loading chat..." />;

  return (
    <OverlayProvider value={{ style: studyBuddyTheme }}>
      <Chat client={chatClient} style={studyBuddyTheme}>
        {children}
      </Chat>
    </OverlayProvider>
  );
};

const ChatWrapper = ({ children }: { children: React.ReactNode }) => {
  const { user, token } = useAuthStore();

  // not signed in — render children directly (auth screens)
  if (!user) return <>{children}</>;

  return (
    <ChatClient user={user} token={token!}>
      {children}
    </ChatClient>
  );
};

export default ChatWrapper;

// TODO: ADD sentry logs link in the video
