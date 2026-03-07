// Types pour le Chat Temps Réel

export interface ChatChannel {
  id: string;
  name: string;
  description: string | null;
  type: ChannelType;
  icon: string | null;
  color: string | null;
  tenantId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;

  // Relations
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  members?: ChatChannelMember[];
  _count?: {
    members: number;
    messages: number;
  };
  lastMessage?: ChatMessage;
  unreadCount?: number;
}

export type ChannelType = "PUBLIC" | "PRIVATE" | "DIRECT";

export interface ChatChannelMember {
  id: string;
  channelId: string;
  userId: string;
  role: ChannelRole;
  joinedAt: Date;
  lastReadAt: Date | null;
  isMuted: boolean;
  isPinned: boolean;

  user?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    presence?: UserPresence;
  };
}

export type ChannelRole = "OWNER" | "ADMIN" | "MEMBER";

export interface ChatMessage {
  id: string;
  channelId: string;
  userId: string;
  content: string;
  type: ChatMessageType;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  editedAt: Date | null;
  deletedAt: Date | null;

  user?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  reactions?: ChatReaction[];
  attachments?: ChatAttachment[];
  mentions?: ChatMention[];
  _count?: {
    replies: number;
    reactions: number;
  };
}

export type ChatMessageType = "TEXT" | "IMAGE" | "FILE" | "SYSTEM";

export interface ChatReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: Date;

  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface ChatAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: Date;
}

export interface ChatMention {
  id: string;
  messageId: string;
  userId: string;
  createdAt: Date;

  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface UserPresence {
  id: string;
  userId: string;
  status: PresenceStatus;
  customStatus: string | null;
  lastSeen: Date;
  updatedAt: Date;
}

export type PresenceStatus = "ONLINE" | "AWAY" | "BUSY" | "OFFLINE";

// WebSocket Events
export interface SocketEvents {
  // Client → Server
  "join-channel": (channelId: string) => void;
  "leave-channel": (channelId: string) => void;
  "send-message": (data: SendMessageData) => void;
  "edit-message": (data: EditMessageData) => void;
  "delete-message": (messageId: string) => void;
  "add-reaction": (data: AddReactionData) => void;
  "remove-reaction": (data: RemoveReactionData) => void;
  "typing-start": (channelId: string) => void;
  "typing-stop": (channelId: string) => void;
  "update-presence": (status: PresenceStatus) => void;

  // Server → Client
  "new-message": (message: ChatMessage) => void;
  "message-edited": (message: ChatMessage) => void;
  "message-deleted": (messageId: string) => void;
  "reaction-added": (data: {
    messageId: string;
    reaction: ChatReaction;
  }) => void;
  "reaction-removed": (data: { messageId: string; reactionId: string }) => void;
  "user-typing": (data: {
    userId: string;
    channelId: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string | null;
    };
  }) => void;
  "user-stopped-typing": (data: { userId: string; channelId: string }) => void;
  "presence-updated": (data: {
    userId: string;
    status: PresenceStatus;
  }) => void;
  "channel-updated": (channel: ChatChannel) => void;
  "member-joined": (data: {
    channelId: string;
    member: ChatChannelMember;
  }) => void;
  "member-left": (data: { channelId: string; userId: string }) => void;
}

export interface SendMessageData {
  channelId: string;
  content: string;
  type?: ChatMessageType;
  parentId?: string;
  mentions?: string[];
  attachments?: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }[];
}

export interface EditMessageData {
  messageId: string;
  content: string;
}

export interface AddReactionData {
  messageId: string;
  emoji: string;
}

export interface RemoveReactionData {
  messageId: string;
  emoji: string;
}
