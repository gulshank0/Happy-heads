export interface User {
    id: string;
    name: string;
    email: string;
    gender?: string;
    age?: number;
    phone?: string;
    bio?: string;
    googleId?: string;
}

export interface AuthRequest extends Request {
    user?: User;
}

export interface UserResponse {
    message: string;
    user: User;
}

export interface ErrorResponse {
    error: string;
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    receiverId: string;
    content: string;
    messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'EMOJI';
    isRead: boolean;
    isDelivered: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Conversation {
    id: string;
    user1Id: string;
    user2Id: string;
    createdAt: Date;
    updatedAt: Date;
    lastMessageAt?: Date;
}

export interface ConversationWithDetails extends Conversation {
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
    messages?: Message[];
}