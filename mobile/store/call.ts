import { create } from "zustand";

interface CallState {
  isCalling: boolean;
  isIncomingCall: boolean;
  isGroupCall: boolean;
  chatId: string | null;
  role: "caller" | "receiver" | null;
  caller: { _id: string; name: string; avatar?: string } | null;
  receiver: { _id: string; name: string; avatar?: string } | null;
  remoteStreams: Map<string, any>; // userId -> MediaStream

  setCallStatus: (status: Partial<CallState>) => void;
  addRemoteStream: (userId: string, stream: any) => void;
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
  remoteStreams: new Map(),

  setCallStatus: (status) => set((state) => ({ ...state, ...status })),

  addRemoteStream: (userId, stream) =>
    set((state) => {
      const streams = new Map(state.remoteStreams);
      streams.set(userId, stream);
      return { remoteStreams: streams };
    }),

  removeRemoteStream: (userId) =>
    set((state) => {
      const streams = new Map(state.remoteStreams);
      streams.delete(userId);
      return { remoteStreams: streams };
    }),

  resetCall: () =>
    set({
      isCalling: false,
      isIncomingCall: false,
      isGroupCall: false,
      chatId: null,
      role: null,
      caller: null,
      receiver: null,
      remoteStreams: new Map(),
    }),
}));
