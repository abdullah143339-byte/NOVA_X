export type MessageType =
  | "TEXT"
  | "IMAGE"
  | "VIDEO"
  | "AUDIO"
  | "FILE"
  | "VOICE_NOTE"
  | "STICKER"
  | "GIF"
  | "CODE"
  | "AI_RESPONSE"
  | "SYSTEM";

export type MessageStatus = "sending" | "sent" | "error";

export interface MessageUser {
  id: string;
  username: string;
  displayName?: string | null;
  avatar?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  role?: string | null;
  isPrivate?: boolean;
  lastActiveAt?: string | null;
}

export interface MessageMedia {
  url: string;
  type?: string;
  name?: string;
  size?: number;
  mime?: string;
  duration?: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  media?: MessageMedia[] | null;
  replyToId?: string | null;
  isEdited?: boolean;
  isDeleted?: boolean;
  isForwarded?: boolean;
  readBy?: string;
  deliveredTo?: string;
  createdAt: string;
  sender?: MessageUser | null;
  replyTo?: {
    id: string;
    content: string;
    type: MessageType;
    media?: MessageMedia[] | null;
    sender?: MessageUser | null;
  } | null;
  status?: MessageStatus;
  optimistic?: boolean;
}

export interface ConversationParticipant {
  userId: string;
  role?: string;
  isMuted?: boolean;
  isPinned?: boolean;
  leftAt?: string | null;
  user?: MessageUser | null;
}

export interface Conversation {
  id: string;
  type: "DIRECT" | "GROUP" | "AI_CHAT" | "COMMUNITY" | "CHANNEL";
  name: string;
  avatar?: string | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  participants: ConversationParticipant[];
  online: boolean;
  typing: boolean;
}

export interface TypingState {
  conversationId: string;
  userId: string;
  isTyping: boolean;
  username?: string;
}

export interface RawReplyTo {
  id: string;
  content?: string | null;
  type?: string;
  media?: MessageMedia[] | null;
  sender?: MessageUser | null;
}

export interface RawMessage {
  id: string;
  conversationId?: string;
  senderId?: string;
  content?: string | null;
  type?: string;
  media?: MessageMedia[] | null;
  replyToId?: string | null;
  isEdited?: boolean;
  isDeleted?: boolean;
  isForwarded?: boolean;
  readBy?: string;
  deliveredTo?: string;
  createdAt?: string;
  sender?: MessageUser | null;
  replyTo?: RawReplyTo | null;
}

export interface RawParticipant {
  userId?: string;
  id?: string;
  role?: string;
  isMuted?: boolean;
  isPinned?: boolean;
  leftAt?: string | null;
  user?: MessageUser | null;
}

export interface RawConversation {
  id: string;
  type?: string;
  name?: string;
  title?: string;
  avatar?: string | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
  participants?: RawParticipant[] | null;
}

export const VERIFIED_ROLES = ["CREATOR", "INSTRUCTOR", "ADMIN", "MODERATOR", "SUPER_ADMIN"];

export function isVerifiedUser(user?: MessageUser | null): boolean {
  return !!user && !!user.role && VERIFIED_ROLES.includes(user.role);
}
