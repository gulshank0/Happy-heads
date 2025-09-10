const API_BASE_URL = 'http://localhost:8000';

export interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
}

export interface Message {
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

export interface Conversation {
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
  messages?: Message[];
}

export const messageService = {
  // Get all conversations
  async getConversations(): Promise<Conversation[]> {
    const response = await fetch(`${API_BASE_URL}/messages/conversations`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch conversations');
    return response.json();
  },

  // Get messages for a conversation
  async getMessages(conversationId: string, page = 1, limit = 50): Promise<Message[]> {
    const response = await fetch(
      `${API_BASE_URL}/messages/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
      { credentials: 'include' }
    );
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  },

  // Send a message with enhanced error handling
  async sendMessage(receiverId: string, content: string, messageType = 'TEXT'): Promise<Message> {
    console.log('🔍 Frontend: Sending message:', { receiverId, content, messageType });
    
    try {
      const response = await fetch(`${API_BASE_URL}/messages/send`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ receiverId, content, messageType })
      });

      console.log('📡 Send message response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to send message`);
      }

      const data = await response.json();
      console.log('✅ Message sent successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Frontend: Failed to send message:', error);
      throw error;
    }
  },

  // Create conversation
  async createConversation(otherUserId: string): Promise<Conversation> {
    const response = await fetch(`${API_BASE_URL}/messages/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ otherUserId })
    });
    if (!response.ok) throw new Error('Failed to create conversation');
    return response.json();
  },

  // Mark messages as read with better error handling
  async markAsRead(conversationId: string): Promise<void> {
    console.log('🔍 Frontend: Marking as read:', conversationId);
    
    try {
      const response = await fetch(`${API_BASE_URL}/messages/conversations/${conversationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      console.log('📡 Mark as read response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to mark as read`);
      }

      const data = await response.json();
      console.log('✅ Messages marked as read successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Frontend: Failed to mark as read:', error);
      throw error;
    }
  },

  // Delete conversation
  async deleteConversation(conversationId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/messages/conversations/${conversationId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to delete conversation');
    return response.json();
  }
};