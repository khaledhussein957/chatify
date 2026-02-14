export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  bio?: string;
  deviceId?: string;
  isVerified: boolean;
}

export interface MessageSender {
  _id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Message {
  _id: string;
  chat: string;
  sender: MessageSender | string;
  type: "text" | "image" | "video" | "voice" | "file";
  text: string;
  content?: string;
  duration?: number;
  replyTo?: Message | string;
  reactions?: {
    emoji: string;
    users: string[];
  }[];
  deleted?: boolean;
  isEdited?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatLastMessage {
  _id: string;
  type: "text" | "image" | "video" | "voice" | "file";
  text: string;
  content?: string;
  duration?: number;
  deleted?: boolean;
  isEdited?: boolean;
  sender: string;
  createdAt: string;
}

export interface Chat {
  _id: string;
  isGroupChat: boolean;
  name?: string;
  groupImage?: string;
  participant?: MessageSender | null; // Null for group chats
  participants: (MessageSender | string)[];
  admins?: string[];
  lastMessage: ChatLastMessage | null;
  lastMessageAt: string;
  createdAt: string;
}

export interface StatusUser {
  _id: string;
  name: string;
  avatar?: string;
}

export interface Status {
  _id: string;
  user: StatusUser;
  text?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  duration?: number;
  viewers: string[];
  reactions: string[];
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}
