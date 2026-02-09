import {
  RTCPeerConnection,
  RTCSessionDescription,
  mediaDevices,
} from "react-native-webrtc";
import { useSocketStore } from "@/lib/socket";

const pcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export const startCall = async (chatId: string, targetUserId: string) => {
  const socket = useSocketStore.getState().socket;
  if (!socket) throw new Error("Socket not connected");

  const pc = new RTCPeerConnection(pcConfig);

  const stream = await mediaDevices.getUserMedia({
    audio: true,
    video: false,
  });

  stream.getTracks().forEach((track) => pc.addTrack(track, stream));

  (pc as any).onicecandidate = (event: any) => {
    if (event.candidate) {
      socket.emit("ice-candidate", {
        targetUserId,
        candidate: event.candidate,
        chatId,
      });
    }
  };

  const offer = await pc.createOffer({});
  await pc.setLocalDescription(offer);

  socket.emit("webrtc-offer", {
    targetUserId,
    sdp: offer,
    chatId,
  });

  return { pc, stream };
};

export const answerCall = async (
  pc: RTCPeerConnection,
  offer: any,
  targetUserId: string,
  chatId: string,
) => {
  const socket = useSocketStore.getState().socket;
  if (!socket) throw new Error("Socket not connected");

  await pc.setRemoteDescription(new RTCSessionDescription(offer));

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  socket.emit("webrtc-answer", {
    targetUserId,
    sdp: answer,
    chatId,
  });
};
