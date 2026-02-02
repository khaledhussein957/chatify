import { Message } from "@/types";
import { View, Text } from "react-native";

/**
 * Render a chat message bubble whose alignment and visual style reflect whether the message is from the current user.
 *
 * @param message - The message object whose `text` will be displayed inside the bubble
 * @param isFromMe - When true, aligns the bubble to the end and applies "from me" styling; otherwise aligns to the start and applies "received" styling
 * @returns The JSX element for the styled message bubble
 */
function MessageBubble({ message, isFromMe }: { message: Message; isFromMe: boolean }) {
  return (
    <View className={`flex-row ${isFromMe ? "justify-end" : "justify-start"}`}>
      <View
        className={`max-w-[80%] px-3 py-2 rounded-2xl ${
          isFromMe
            ? "bg-primary rounded-br-sm"
            : "bg-surface-card rounded-bl-sm border border-surface-light"
        }`}
      >
        <Text className={`text-sm ${isFromMe ? "text-surface-dark" : "text-foreground"}`}>
          {message.text}
        </Text>
      </View>
    </View>
  );
}

export default MessageBubble;