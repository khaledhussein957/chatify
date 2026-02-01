import { View, Text, Pressable } from "react-native";
import React from "react";
import { useAuth } from "@clerk/clerk-expo";

const index = () => {
  const { signOut } = useAuth();
  return (
    <View>
      <Text>index</Text>

      <Pressable onPress={() => signOut()}>
        <Text>Sign Out</Text>
      </Pressable>
    </View>
  );
};

export default index;
