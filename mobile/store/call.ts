import { create } from "zustand";
import { RTCPeerConnection, MediaStream } from "react-native-webrtc";

interface CallState {
  isCalling: boolean;
  isIncomingCall: boolean;
  isGroupCall: boolean;
  chatId: string | null;
  role: "caller" | "receiver" | null;
  caller: { _id: string; name: string; avatar?: string } | null;
  receiver: { _id: string; name: string; avatar?: string } | null;

  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>; // userId -> Stream (for group calls)
  peerConnections: Map<string, RTCPeerConnection>; // userId -> PC

  setCallStatus: (status: {
    isCalling?: boolean;
    isIncomingCall?: boolean;
    isGroupCall?: boolean;
    chatId?: string | null;
    role?: "caller" | "receiver" | null;
    caller?: any;
    receiver?: any;
  }) => void;

  addPeerConnection: (userId: string, pc: RTCPeerConnection) => void;
  removePeerConnection: (userId: string) => void;

  setLocalStream: (stream: MediaStream | null) => void;
  addRemoteStream: (userId: string, stream: MediaStream) => void;
  removeRemoteStream: (userId: string) => void;

  resetCall: () => void;
}

export const useCallStore = create<CallState>((set) => ({
  isCalling: false,
  isIncomingCall: false,
  isGroupCall: false,
  chatId: null,
  role: null,
  caller: null,
  receiver: null,

  localStream: null,
  remoteStreams: new Map(),
  peerConnections: new Map(),

  setCallStatus: (status) => set((state) => ({ ...state, ...status })),

  addPeerConnection: (userId, pc) =>
    set((state) => {
      const newPCs = new Map(state.peerConnections);
      newPCs.set(userId, pc);
      return { peerConnections: newPCs };
    }),

  removePeerConnection: (userId) =>
    set((state) => {
      const newPCs = new Map(state.peerConnections);
      const pc = newPCs.get(userId);
      pc?.close();
      newPCs.delete(userId);
      return { peerConnections: newPCs };
    }),

  setLocalStream: (stream) => set({ localStream: stream }),

  addRemoteStream: (userId, stream) =>
    set((state) => {
      const newStreams = new Map(state.remoteStreams);
      newStreams.set(userId, stream);
      return { remoteStreams: newStreams };
    }),

  removeRemoteStream: (userId) =>
    set((state) => {
      const newStreams = new Map(state.remoteStreams);
      newStreams.delete(userId);
      return { remoteStreams: newStreams };
    }),

  resetCall: () =>
    set((state) => {
      // Close all connections
      state.peerConnections.forEach((pc) => pc.close());
      state.localStream?.getTracks().forEach((t) => t.stop());

      return {
        isCalling: false,
        isIncomingCall: false,
        isGroupCall: false,
        chatId: null,
        role: null,
        caller: null,
        receiver: null,
        localStream: null,
        remoteStreams: new Map(),
        peerConnections: new Map(),
      };
    }),
}));
