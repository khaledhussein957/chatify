import React, { useEffect, useState } from "react";
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
  mediaDevices,
} from "react-native-webrtc";
import { Ionicons } from "@expo/vector-icons";
import { useCallStore } from "@/store/call";
import { useSocketStore } from "@/lib/socket";

const configuration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

const CallOverlay = () => {
  const {
    isIncomingCall,
    isCalling,
    caller,
    receiver,
    chatId,
    setCallStatus,
    resetCall,
    localStream,
    setLocalStream,
    addRemoteStream,
    peerConnections,
    addPeerConnection,
  } = useCallStore();

  const socket = useSocketStore((state) => state.socket);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    let pc: RTCPeerConnection | null = null;

    const startCall = async () => {
      try {
        const stream = await mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        setLocalStream(stream);

        pc = new RTCPeerConnection(configuration);

        (pc as any).addEventListener("icecandidate", (event: any) => {
          if (event.candidate) {
            const targetId = isCalling ? receiver?._id : caller?._id;
            if (targetId) {
              socket?.emit("ice-candidate", {
                targetUserId: targetId,
                candidate: event.candidate,
                chatId,
              });
            }
          }
        });

        (pc as any).addEventListener("track", (event: any) => {
          const targetId = isCalling ? receiver?._id : caller?._id;
          if (targetId && event.streams && event.streams[0]) {
            addRemoteStream(targetId, event.streams[0]);
          }
        });

        const targetId = isCalling ? receiver?._id : caller?._id;
        if (targetId) addPeerConnection(targetId, pc);

        // Caller: Emit call-user, but wait for 'call-accepted' to send Offer
        if (isCalling) {
          socket?.emit("call-user", { chatId, isGroup: false }); // Ensure backend handles this
        }
      } catch (err) {
        console.error("Error starting call:", err);
        endCall();
      }
    };

    if ((isCalling || isIncomingCall) && !peerConnections.size) {
      // Prepare media/PC for both Caller and Receiver (once accepted for receiver, but here we prep early is fine too?
      // No, Receiver should prep on Accept. Caller preps immediately.
      if (isCalling) {
        startCall();
      }
    }

    return () => {
      // cleanup handled by resetCall
    };
  }, [isCalling]);

  // Handle Socket Events
  useEffect(() => {
    if (!socket) return;

    const handleCallAccepted = async (data: any) => {
      if (isCalling) {
        // Only caller handles this
        const targetId = receiver?._id;
        const pc = peerConnections.get(targetId!);
        if (pc) {
          const offer = await pc.createOffer({});
          await pc.setLocalDescription(offer);
          socket.emit("webrtc-offer", {
            targetUserId: targetId,
            sdp: offer,
            chatId,
          });
        }
      }
    };

    const handleOffer = async (data: any) => {
      // Receiver handles offer
      // We expect this ONLY if we are in a call (accepted)
      // Check if we have a PC for this sender
      let pc = peerConnections.get(data.senderId);

      // If we accepted but haven't created PC yet (race condition?), we should ensure PC exists.
      // But onAccept creates PC.
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc-answer", {
          targetUserId: data.senderId,
          sdp: answer,
          chatId,
        });
      }
    };

    const handleAnswer = async (data: any) => {
      const pc = peerConnections.get(data.senderId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      }
    };

    const handleCandidate = async (data: any) => {
      const pc = peerConnections.get(data.senderId);
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    };

    socket.on("call-accepted", handleCallAccepted);
    socket.on("webrtc-offer", handleOffer);
    socket.on("webrtc-answer", handleAnswer);
    socket.on("ice-candidate", handleCandidate);

    return () => {
      socket.off("call-accepted", handleCallAccepted);
      socket.off("webrtc-offer", handleOffer);
      socket.off("webrtc-answer", handleAnswer);
      socket.off("ice-candidate", handleCandidate);
    };
  }, [socket, peerConnections, isCalling, receiver, chatId]);

  const onAccept = async () => {
    setCallStatus({ isIncomingCall: false, isCalling: true });

    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      setLocalStream(stream);

      const pc = new RTCPeerConnection(configuration);

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      (pc as any).addEventListener("icecandidate", (event: any) => {
        if (event.candidate) {
          socket?.emit("ice-candidate", {
            targetUserId: caller?._id,
            candidate: event.candidate,
            chatId,
          });
        }
      });

      (pc as any).addEventListener("track", (event: any) => {
        if (caller?._id && event.streams && event.streams[0]) {
          addRemoteStream(caller._id, event.streams[0]);
        }
      });

      if (caller?._id) addPeerConnection(caller._id, pc);

      socket?.emit("accept-call", { chatId });
    } catch (err) {
      console.error("Accept error:", err);
      endCall();
    }
  };

  const onReject = () => {
    if (caller && chatId) {
      socket?.emit("reject-call", { chatId, callerId: caller._id });
    }
    resetCall();
  };

  const endCall = () => {
    if (chatId) {
      socket?.emit("end-call", { chatId });
    }
    resetCall();
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
      setIsMuted(!isMuted);
    }
  };

  if (!isIncomingCall && !isCalling) return null;

  return (
    <Modal visible={true} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.name}>
              {isIncomingCall ? caller?.name : receiver?.name}
            </Text>
            <Text style={styles.status}>
              {isIncomingCall ? "Incoming Audio Call..." : "Connected"}
            </Text>
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
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 50,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginTop: 50,
  },
  name: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
  },
  status: {
    fontSize: 16,
    color: "#cccccc",
  },
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
  acceptBtn: {
    backgroundColor: "#4cd964",
  },
  rejectBtn: {
    backgroundColor: "#ff3b30",
  },
  controlBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  activeBtn: {
    backgroundColor: "white",
  },
  btnText: {
    color: "white",
    marginTop: 5,
    fontSize: 12,
  },
});

export default CallOverlay;
