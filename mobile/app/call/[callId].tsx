import React, { useEffect, useState, useMemo } from "react";
import { StyleSheet, View, Text, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants/theme";
import { useAlert } from "@/components/AlertMessageController";

const CallScreen = () => {
  const params = useLocalSearchParams();
  const callId = params.callId as string;
  const router = useRouter();
  const alert = useAlert();
  const [call, setCall] = useState<any>(null);

  const sdk = useMemo(() => {
    try {
      return require("@stream-io/video-react-native-sdk");
    } catch (e) {
      console.log("Stream Video SDK not available");
      return null;
    }
  }, []);

  const client = sdk?.useStreamVideoClient?.();

  useEffect(() => {
    if (!client || !callId) return;

    const _call = client.call("default", callId);
    _call
      .join()
      .then(() => {
        setCall(_call);
      })
      .catch((err: any) => {
        console.error("Failed to join call", err);
        alert.error("Failed to join call");
        router.back();
      });

    return () => {
      _call.leave();
    };
  }, [client, callId, alert, router]);

  if (!sdk?.StreamCall || !sdk?.CallContent) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          Video calls are not supported on this device/environment.
        </Text>
      </View>
    );
  }

  const { StreamCall, CallContent } = sdk;

  if (!call) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.text}>Joining call...</Text>
      </View>
    );
  }

  return (
    <StreamCall call={call}>
      <SafeAreaView style={styles.container}>
        <CallContent onHangupCallHandler={() => router.back()} />
      </SafeAreaView>
    </StreamCall>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#fff",
    marginTop: 10,
  },
});

export default CallScreen;
