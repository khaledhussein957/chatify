import { Message } from "@/types";
import { View, Text, StyleSheet } from "react-native";

function MessageBubble({
  message,
  isFromMe,
}: {
  message: Message;
  isFromMe: boolean;
}) {
  return (
    <View
      style={[
        styles.row,
        isFromMe ? styles.justifyEnd : styles.justifyStart,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isFromMe ? styles.bubbleMe : styles.bubbleOther,
        ]}
      >
        <Text
          style={[
            styles.text,
            isFromMe ? styles.textMe : styles.textOther,
          ]}
        >
          {message.text}
        </Text>
      </View>
    </View>
  );
}

export default MessageBubble;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
  },
  justifyEnd: {
    justifyContent: "flex-end",
  },
  justifyStart: {
    justifyContent: "flex-start",
  },

  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },

  bubbleMe: {
    backgroundColor: "#F4A261",
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: "#1A1A1E",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#1C1C20",
  },

  text: {
    fontSize: 14,
  },
  textMe: {
    color: "#0D0D0F",
  },
  textOther: {
    color: "#FFFFFF",
  },
});
