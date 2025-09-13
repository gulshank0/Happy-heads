import { MessageCircle, Send, Search, MoreVertical, Phone, Video, Trash2, AlertCircle, Plus, Wifi, WifiOff } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { messageService, Conversation, Message } from "../../services/messageService";
import websocketService from "../../services/websocketService";
import StartConversation from './StartConversation';

interface TypingUser {
  userId: string;
  conversationId: string;
}

export default function Messenger() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showStartConversation, setShowStartConversation] = useState(false);
  
  // WebSocket specific state
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'failed' | 'fallback'>('disconnected');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get current user info and initialize WebSocket
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        setLoading(true);
        
        const possibleEndpoints = [
          'http://localhost:8000/auth/me',
          'http://localhost:8000/api/auth/me', 
          'http://localhost:8000/users/verify',
          'http://localhost:8000/auth/profile'
        ];
        
        let userData = null;
        
        for (const endpoint of possibleEndpoints) {
          try {
            console.log(`🔍 Trying endpoint: ${endpoint}`);
            const response = await fetch(endpoint, {
              credentials: 'include',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              userData = data.user || data;
              console.log('✅ User data retrieved from:', endpoint, userData);
              break;
            }
          } catch (err) {
            console.log(`❌ ${endpoint} failed:`, err);
          }
        }
        
        if (userData && userData.id) {
          setCurrentUser(userData);
          
          // Initialize real-time messaging with proper user data
          try {
            await messageService.initializeRealTime();
            
            // Initialize WebSocket connection with user ID
            await websocketService.connect({
              userId: userData.id,
              token: localStorage.getItem('authToken') || undefined,
              maxReconnectAttempts: 5,
              reconnectInterval: 3000,
              heartbeatInterval: 30000
            });
            
            console.log('✅ WebSocket connected for user:', userData.id);
            setConnectionStatus('connected');
          } catch (socketError) {
            console.error('❌ WebSocket connection failed:', socketError);
            setConnectionStatus('fallback');
            setError('Real-time messaging unavailable. Using fallback mode.');
          }
          
          // Load conversations after user is set
          await loadConversations();
        } else {
          setError('Failed to get user information. Please log in again.');
          setConnectionStatus('disconnected');
        }
      } catch (error) {
        console.error('❌ Failed to get user information:', error);
        setError('Failed to get user information');
        setConnectionStatus('disconnected');
      } finally {
        setLoading(false);
      }
    };
    
    getCurrentUser();

    // Cleanup on unmount
    return () => {
      websocketService.disconnect();
    };
  }, []);

  // Setup WebSocket event listeners
  useEffect(() => {
    const unsubscribeFunctions: (() => void)[] = [];

    // Connection events
    const handleConnect = () => {
      setIsConnected(true);
      setConnectionState('connected');
      setError(null);
      console.log('✅ WebSocket connected');
    };

    const handleDisconnect = (data: { code: number; reason: string }) => {
      setIsConnected(false);
      setConnectionState('disconnected');
      setError(`Connection lost (${data.code}). Attempting to reconnect...`);
      console.log('🔌 WebSocket disconnected:', data);
    };

    const handleReconnecting = (data: { attempt: number; maxAttempts: number }) => {
      setReconnectAttempts(data.attempt);
      setConnectionState('reconnecting');
      setError(`Reconnecting... (${data.attempt}/${data.maxAttempts})`);
    };

    const handleReconnected = () => {
      setIsConnected(true);
      setConnectionState('connected');
      setReconnectAttempts(0);
      setError(null);
      console.log('✅ WebSocket reconnected');
    };

    const handleReconnectFailed = () => {
      setIsConnected(false);
      setConnectionState('failed');
      setError('Failed to reconnect. Please refresh the page.');
    };

    // Message events
    const handleNewMessage = (data: { message: Message; conversationId: string }) => {
      console.log('📨 Received new message:', data);
      
      if (selectedConversation === data.conversationId) {
        setMessages(prev => [...prev, data.message]);
      }
      
      // Update conversation last message
      setConversations(prev => 
        prev.map(conv => 
          conv.id === data.conversationId 
            ? {
                ...conv,
                lastMessage: {
                  id: data.message.id,
                  senderId: data.message.senderId,
                  content: data.message.content,
                  timestamp: data.message.timestamp,
                  isRead: data.message.isRead
                },
                unreadCount: selectedConversation === data.conversationId ? 0 : (conv.unreadCount || 0) + 1
              }
            : conv
        )
      );
    };

    const handleMessageSent = (data: { message: Message; conversationId: string }) => {
      console.log('📤 Message sent confirmation:', data);
      // Message already added optimistically, just update if needed
    };

    const handleTyping = (data: { userId: string; conversationId: string; typing: boolean }) => {
      if (data.userId === currentUser?.id) return;

      setTypingUsers(prev => {
        if (data.typing) {
          const alreadyTyping = prev.find(u => u.userId === data.userId && u.conversationId === data.conversationId);
          if (alreadyTyping) return prev;
          return [...prev, { userId: data.userId, conversationId: data.conversationId }];
        } else {
          return prev.filter(u => !(u.userId === data.userId && u.conversationId === data.conversationId));
        }
      });
    };

    const handleMessagesRead = (data: { conversationId: string; readBy: string }) => {
      if (data.readBy === currentUser?.id) return;

      setMessages(prev => 
        prev.map(message => 
          message.senderId === currentUser?.id 
            ? { ...message, isRead: true }
            : message
        )
      );
    };

    const handleUserStatusChanged = (data: { userId: string; isOnline: boolean; lastSeen: string }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (data.isOnline) {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });

      setConversations(prev => 
        prev.map(conv => 
          conv.user.id === data.userId 
            ? {
                ...conv,
                user: {
                  ...conv.user,
                  isOnline: data.isOnline,
                  lastSeen: data.isOnline ? 'Online' : new Date(data.lastSeen).toLocaleString()
                }
              }
            : conv
        )
      );
    };

    const handleError = (data: { errorType?: string; message?: string; type?: string; data?: any }) => {
      console.error('🔌 WebSocket error:', data);
      
      // Handle different types of errors
      if (data.type === 'error' && data.data) {
        const errorMessage = data.data.message || data.data.error || 'Unknown WebSocket error';
        const errorType = data.data.errorType || data.data.type || 'general';
        
        console.error(`❌ WebSocket ${errorType} error:`, errorMessage);
        
        // Handle specific error types
        switch (errorType) {
          case 'authentication':
            setError('Authentication error. Please refresh and login again.');
            setConnectionStatus('disconnected');
            break;
          case 'message_send':
            setError('Failed to send message. Trying alternative method...');
            // Try to send via HTTP as fallback
            handleSendMessageFallback();
            break;
          case 'permission':
            setError('Permission denied. Please check your access rights.');
            break;
          default:
            setError(`WebSocket error: ${errorMessage}`);
        }
      } else {
        const errorMessage = data.message || 'Unknown WebSocket error occurred';
        setError(`WebSocket error: ${errorMessage}`);
      }
    };

    // Add fallback message sending
    const handleSendMessageFallback = async () => {
      if (!newMessage.trim() || !selectedConversation || !currentUser) {
        return;
      }
      
      const currentConversation = conversations.find(conv => conv.id === selectedConversation);
      if (!currentConversation) {
        return;
      }

      const receiverId = currentConversation.user.id;
      const messageToSend = newMessage.trim();

      try {
        console.log('🔄 Sending message via HTTP fallback...');
        
        // Use correct parameters for messageService.sendMessage
        const message = await messageService.sendMessage(
          selectedConversation,
          receiverId,
          messageToSend,
          'TEXT'
        );
        
        // Add message to local state
        setMessages(prev => [...prev, message]);
        setNewMessage("");
        console.log('✅ Message sent via HTTP fallback');
        
        // Update conversations list
        setConversations(prev => 
          prev.map(conv => 
            conv.id === selectedConversation 
              ? {
                  ...conv,
                  lastMessage: {
                    id: message.id,
                    senderId: message.senderId,
                    content: message.content,
                    timestamp: message.timestamp,
                    isRead: message.isRead
                  }
                }
              : conv
          )
        );
        
      } catch (error) {
        console.error('❌ HTTP fallback also failed:', error);
        setError('Failed to send message. Please try again.');
      }
    };

    // Subscribe to events
    unsubscribeFunctions.push(websocketService.on('connect', handleConnect));
    unsubscribeFunctions.push(websocketService.on('disconnect', handleDisconnect));
    unsubscribeFunctions.push(websocketService.on('reconnecting', handleReconnecting));
    unsubscribeFunctions.push(websocketService.on('reconnected', handleReconnected));
    unsubscribeFunctions.push(websocketService.on('reconnect-failed', handleReconnectFailed));
    unsubscribeFunctions.push(websocketService.on('new-message', handleNewMessage));
    unsubscribeFunctions.push(websocketService.on('message-sent', handleMessageSent));
    unsubscribeFunctions.push(websocketService.on('user-typing', handleTyping));
    unsubscribeFunctions.push(websocketService.on('messages-read', handleMessagesRead));
    unsubscribeFunctions.push(websocketService.on('user-status-changed', handleUserStatusChanged));
    unsubscribeFunctions.push(websocketService.on('error', handleError));

    // Update connection state periodically
    const stateInterval = setInterval(() => {
      setConnectionState(websocketService.getConnectionState());
      setReconnectAttempts(websocketService.getReconnectAttempts());
    }, 1000);

    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
      clearInterval(stateInterval);
    };
  }, [selectedConversation, currentUser?.id]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      markConversationAsRead(selectedConversation);
      
      // Join conversation room for real-time updates
      if (websocketService.isConnected()) {
        websocketService.joinConversation(selectedConversation);
      }
    }

    // Leave previous conversation room
    return () => {
      if (selectedConversation && websocketService.isConnected()) {
        websocketService.leaveConversation(selectedConversation);
      }
    };
  }, [selectedConversation]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await messageService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const data = await messageService.getMessages(conversationId);
      setMessages(data);
    } catch (error) {
      setError('Failed to load messages');
    }
  };

  const markConversationAsRead = async (conversationId: string) => {
    try {
      if (websocketService.isConnected()) {
        await websocketService.markAsRead(conversationId);
      } else {
        await messageService.markAsRead(conversationId);
      }
      
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser || sendingMessage) {
      return;
    }
    
    const currentConversation = conversations.find(conv => conv.id === selectedConversation);
    if (!currentConversation) {
      setError('No conversation selected');
      return;
    }

    const receiverId = currentConversation.user.id;
    const messageToSend = newMessage.trim();

    try {
      setSendingMessage(true);
      setError(null);
      setNewMessage(""); // Clear input immediately

      // Create optimistic message
      const optimisticMessage: Message = {
        id: `temp_${Date.now()}_${Math.random()}`,
        senderId: currentUser.id,
        receiverId: receiverId,
        content: messageToSend,
        messageType: 'TEXT',
        timestamp: new Date().toISOString(),
        isRead: false,
        conversationId: selectedConversation,
        sender: {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar
        }
      };
      
      // Add optimistic message immediately
      setMessages(prev => [...prev, optimisticMessage]);

      if (websocketService.isConnected()) {
        // Send via WebSocket
        await websocketService.sendChatMessage({
          conversationId: selectedConversation,
          receiverId: receiverId,
          content: messageToSend,
          messageType: 'TEXT'
        });
        console.log('📤 Message sent via WebSocket');
      } else {
        // Fallback to HTTP
        console.log('📤 WebSocket not connected, falling back to HTTP');
        const sentMessage = await messageService.sendMessage(
          receiverId,
          messageToSend,
          'TEXT'
        );
        
        // Replace optimistic message with real one
        setMessages(prev => 
          prev.map(msg => 
            msg.id === optimisticMessage.id ? sentMessage : msg
          )
        );
        
        setConversations(prev => 
          prev.map(conv => 
            conv.id === selectedConversation 
              ? {
                  ...conv,
                  lastMessage: {
                    id: sentMessage.id,
                    senderId: sentMessage.senderId,
                    content: sentMessage.content,
                    timestamp: sentMessage.timestamp,
                    isRead: sentMessage.isRead
                  }
                }
              : conv
          )
        );
        console.log('📤 Message sent via HTTP fallback');
      }
    } catch (error: any) {
      console.error('❌ Failed to send message:', error);
      setNewMessage(messageToSend); // Restore message on error
      setError(error.message || 'Failed to send message. Please try again.');
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== `temp_${Date.now()}_${Math.random()}`));
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) return;
    
    try {
      await messageService.deleteConversation(conversationId);
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      setError('Failed to delete conversation');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleConversationCreated = (conversationId: string) => {
    loadConversations();
    setSelectedConversation(conversationId);
  };

  const currentConversation = conversations.find(conv => conv.id === selectedConversation);

  const filteredConversations = conversations.filter(conv =>
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-[calc(100vh-100px)] flex items-center justify-center bg-white/10 rounded-xl">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex">
      {/* Connection Status Banner */}
      {connectionStatus === 'fallback' && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-600 text-white text-center py-2 text-sm z-50">
          Real-time messaging unavailable. Using fallback mode.
        </div>
      )}
      
      {connectionStatus === 'disconnected' && (
        <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-center py-2 text-sm z-50">
          Messaging unavailable. Please check your connection.
        </div>
      )}

      <div className={`flex w-full ${connectionStatus !== 'connected' ? 'pt-10' : ''}`}>
        <div className="w-1/3 border-r border-gray-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-white flex items-center">
                <MessageCircle className="w-6 h-6 mr-2 text-pink-400" />
                <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                  Messages
                </span>
                {/* Connection Status Indicator */}
                <div className="ml-3 flex items-center">
                  {isConnected ? (
                    <div className="flex items-center text-green-400">
                      <Wifi className="w-4 h-4 mr-1" />
                      <span className="text-xs">Live</span>
                    </div>
                  ) : connectionState === 'reconnecting' ? (
                    <div className="flex items-center text-yellow-400">
                      <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mr-1"></div>
                      <span className="text-xs">Reconnecting {reconnectAttempts}/5</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-400">
                      <WifiOff className="w-4 h-4 mr-1" />
                      <span className="text-xs">Offline</span>
                    </div>
                  )}
                </div>
              </h1>
              <button
                onClick={() => setShowStartConversation(true)}
                className="p-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-lg hover:from-violet-600 hover:to-pink-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-400"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gradient-to-r from-violet-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No conversations yet</h3>
                <p className="text-gray-400 text-sm">Start matching to begin conversations!</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors group ${
                    selectedConversation === conversation.id ? 'bg-gray-800' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative flex-shrink-0">
                      <img
                        src={conversation.user.avatar || '/default-avatar.png'}
                        alt={conversation.user.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      {conversation.user.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900"></div>
                      )}
                    </div>
                    
                    <div 
                      className="flex-1 min-w-0"
                      onClick={() => setSelectedConversation(conversation.id)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-white truncate">{conversation.user.name}</h3>
                        <div className="flex items-center space-x-2">
                          {conversation.lastMessage && (
                            <span className="text-xs text-gray-400">{conversation.lastMessage.timestamp}</span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConversation(conversation.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-300 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        {conversation.lastMessage ? (
                          <p className="text-sm text-gray-300 truncate">
                            {conversation.lastMessage.content}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No messages yet</p>
                        )}
                        {conversation.unreadCount > 0 && (
                          <span className="bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2 flex-shrink-0">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation && currentConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={currentConversation.user.avatar || '/default-avatar.png'}
                      alt={currentConversation.user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {currentConversation.user.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{currentConversation.user.name}</h3>
                    <p className="text-sm text-gray-400">
                      {currentConversation.user.isOnline ? 'Online' : `Last seen ${currentConversation.user.lastSeen}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                    <Video className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                  const messageSenderId = message.senderId || message.sender?.id;
                  const isMyMessage = messageSenderId === currentUser?.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-lg ${
                          isMyMessage
                            ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white'
                            : 'bg-gray-700 text-white'
                        }`}
                      >
                        <p>{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          isMyMessage ? 'text-white/70' : 'text-gray-400'
                        }`}>
                          {new Date(message.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-700">
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault(); // Prevent form submission
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-400"
                    disabled={sendingMessage}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className="p-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-lg hover:from-violet-600 hover:to-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingMessage ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* No conversation selected */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-violet-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Select a conversation</h2>
                <p className="text-gray-400">Choose a conversation from the sidebar to start messaging</p>
              </div>
            </div>
          )}
        </div>

        {/* Start Conversation Modal */}
        <StartConversation
          isOpen={showStartConversation}
          onClose={() => setShowStartConversation(false)}
          onConversationCreated={handleConversationCreated}
        />
      </div>
    </div>
  );
}