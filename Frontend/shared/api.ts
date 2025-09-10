/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Message related types
 */
export interface MessageUser {
  id: string;
  name: string;
  avatar: string;
  email: string;
}

export interface MessageData {
  id: string;
  senderId: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'EMOJI';
  timestamp: string;
  isRead: boolean;
  sender: {
    id: string;
    name: string;
    avatar: string;
  };
}

export interface ConversationData {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    lastSeen: string;
    isOnline: boolean;
  };
  lastMessage: {
    id: string;
    senderId: string;
    content: string;
    timestamp: string;
    isRead: boolean;
  } | null;
  unreadCount: number;
  messages?: MessageData[];
}

export interface MessageResponse {
  success: boolean;
  data?: MessageData;
  error?: string;
}

export interface ConversationsResponse {
  success: boolean;
  data?: ConversationData[];
  error?: string;
}
