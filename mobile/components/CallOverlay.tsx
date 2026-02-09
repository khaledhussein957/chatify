import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from "react-native";
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
} from "react-native-webrtc";
import { Ionicons } from "@expo/vector-icons";
import { useCallStore } from "@/store/call";
import { useSocketStore } from "@/lib/socket";
import {
  startCall as startCallService,
  answerCall as answerCallService,
} from "@/services/call";

const CallOverlay = () => {
  const {
    isIncomingCall,
    isCalling,
    caller,
    receiver,
    chatId,
    role,
    setCallStatus,
    resetCall,
    addRemoteStream,
    remoteStreams,
  } = useCallStore();

  const socket = useSocketStore((state) => state.socket);
  const [isMuted, setIsMuted] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<any>(null);

  const cleanup = React.useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((t: any) => t.stop());
      setLocalStream(null);
    }
    resetCall();
  }, [localStream, resetCall]);

  const endCall = React.useCallback(() => {
    if (chatId && socket) {
      socket.emit("end-call", { chatId });
    }
    cleanup();
  }, [chatId, socket, cleanup]);

  const onAccept = React.useCallback(async () => {
    try {
      if (!chatId || !caller?._id || !socket) return;

      const { pc, stream } = await startCallService(chatId!, caller._id);
      pcRef.current = pc;
      setLocalStream(stream);

      (pc as any).onicecandidate = (event: any) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            targetUserId: caller._id,
            candidate: event.candidate,
            chatId,
          });
        }
      };

      (pc as any).ontrack = (event: any) => {
        if (event.streams && event.streams[0]) {
          addRemoteStream(caller._id, event.streams[0]);
        }
      };

      socket.emit("accept-call", { chatId });
      setCallStatus({ isIncomingCall: false, isCalling: true });
    } catch (err) {
      console.error("Accept error:", err);
      endCall();
    }
  }, [caller?._id, chatId, socket, addRemoteStream, setCallStatus, endCall]);

  const onReject = React.useCallback(() => {
    if (caller && chatId && socket) {
      socket.emit("reject-call", { chatId, callerId: caller._id });
    }
    resetCall();
  }, [caller, chatId, socket, resetCall]);

  const toggleMute = React.useCallback(() => {
    if (localStream) {
      localStream
        .getAudioTracks()
        .forEach((t: any) => (t.enabled = !t.enabled));
      setIsMuted(!isMuted);
    }
  }, [localStream, isMuted]);

  useEffect(() => {
    const handleStart = async () => {
      try {
        if (!chatId || !receiver?._id || !socket) return;
        const { pc, stream } = await startCallService(chatId!, receiver._id);
        pcRef.current = pc;
        setLocalStream(stream);

        (pc as any).onicecandidate = (event: any) => {
          if (event.candidate && chatId) {
            socket.emit("ice-candidate", {
              targetUserId: receiver._id,
              candidate: event.candidate,
              chatId,
            });
          }
        };

        (pc as any).ontrack = (event: any) => {
          if (event.streams && event.streams[0]) {
            addRemoteStream(receiver._id, event.streams[0]);
          }
        };

        socket.emit("call-user", { chatId, isGroup: false });
      } catch (err) {
        console.error("Error starting call:", err);
        endCall();
      }
    };

    if (isCalling && role === "caller" && !pcRef.current) {
      handleStart();
    }
  }, [
    isCalling,
    role,
    chatId,
    receiver?._id,
    socket,
    addRemoteStream,
    endCall,
  ]);

  useEffect(() => {
    if (!socket) return;

    const handleCallAccepted = async (data: any) => {
      // initiator handles acceptance (we already created pc in handleStart)
    };

    const handleOffer = async (data: any) => {
      if (pcRef.current && data.chatId === chatId) {
        await answerCallService(
          pcRef.current,
          data.sdp,
          data.senderId,
          chatId!,
        );
      }
    };

    const handleAnswer = async (data: any) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(
          new RTCSessionDescription(data.sdp),
        );
      }
    };

    const handleCandidate = async (data: any) => {
      if (pcRef.current) {
        await pcRef.current.addIceCandidate(
          new RTCIceCandidate(data.candidate),
        );
      }
    };

    const handleCallEnded = () => {
      cleanup();
    };

    socket.on("call-accepted", handleCallAccepted);
    socket.on("webrtc-offer", handleOffer);
    socket.on("webrtc-answer", handleAnswer);
    socket.on("ice-candidate", handleCandidate);
    socket.on("call-ended", handleCallEnded);

    return () => {
      socket.off("call-accepted", handleCallAccepted);
      socket.off("webrtc-offer", handleOffer);
      socket.off("webrtc-answer", handleAnswer);
      socket.off("ice-candidate", handleCandidate);
      socket.off("call-ended", handleCallEnded);
    };
  }, [socket, chatId, cleanup]);

  if (!isIncomingCall && !isCalling) return null;

  return (
    <Modal visible={true} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.name}>
              {role === "caller" ? receiver?.name : caller?.name}
            </Text>
            <Text style={styles.status}>
              {isIncomingCall ? "Incoming Audio Call..." : "Connected"}
            </Text>
            {Array.from(remoteStreams.values()).map((stream, idx) => (
              <RTCView
                key={idx}
                streamURL={stream.toURL()}
                style={{ width: 0, height: 0, opacity: 0 }}
              />
            ))}
          </View>

          <View style={styles.controls}>
            {isIncomingCall ? (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.rejectBtn]}
                  onPress={onReject}
                >
                  <Ionicons name="close" size={32} color="white" />
                  <Text style={styles.btnText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.acceptBtn]}
                  onPress={onAccept}
                >
                  <Ionicons name="call" size={32} color="white" />
                  <Text style={styles.btnText}>Accept</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.controlBtn,
                    isMuted && styles.activeBtn,
                  ]}
                  onPress={toggleMute}
                >
                  <Ionicons
                    name={isMuted ? "mic-off" : "mic"}
                    size={28}
                    color="white"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.rejectBtn]}
                  onPress={endCall}
                >
                  <Ionicons name="call" size={32} color="white" />
                  <Text style={styles.btnText}>End</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a1a" },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 50,
    alignItems: "center",
  },
  header: { alignItems: "center", marginTop: 50 },
  name: { fontSize: 28, fontWeight: "bold", color: "white", marginBottom: 10 },
  status: { fontSize: 16, color: "#cccccc" },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "80%",
    marginBottom: 50,
  },
  button: {
    justifyContent: "center",
    alignItems: "center",
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  acceptBtn: { backgroundColor: "#4cd964" },
  rejectBtn: { backgroundColor: "#ff3b30" },
  controlBtn: { backgroundColor: "rgba(255,255,255,0.2)" },
  activeBtn: { backgroundColor: "white" },
  btnText: { color: "white", marginTop: 5, fontSize: 12 },
});

export default CallOverlay;
