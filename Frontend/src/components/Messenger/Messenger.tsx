import { MessageCircle, Send, Search, MoreVertical, Phone, Video, Trash2, AlertCircle, Plus } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { messageService, Conversation, Message } from "../../services/messageService";
import StartConversation from './StartConversation';

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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get current user info
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        // Try different possible endpoints
        const possibleEndpoints = [
          'http://localhost:8000/auth/me',
          'http://localhost:8000/api/auth/me', 
          'http://localhost:8000/user/me',
          'http://localhost:8000/auth/profile'
        ];
        
        let userData = null;
        
        for (const endpoint of possibleEndpoints) {
          try {
            console.log(`🔍 Trying endpoint: ${endpoint}`);
            const response = await fetch(endpoint, {
              credentials: 'include'
            });
            
            if (response.ok) {
              const data = await response.json();
              console.log(`✅ Success with ${endpoint}:`, data);
              userData = data.user || data; // Handle different response formats
              break;
            } else {
              console.log(`❌ ${endpoint} returned ${response.status}`);
            }
          } catch (err) {
            console.log(`❌ ${endpoint} failed:`, err);
          }
        }
        
        if (userData) {
          setCurrentUser(userData);
          console.log('✅ Current user set:', userData);
        } else {
          console.error('❌ No valid endpoint found for current user');
          setError('Failed to get user information. Please log in again.');
        }
      } catch (error) {
        console.error('Failed to get current user:', error);
        setError('Failed to get user information');
      }
    };
    getCurrentUser();
  }, []);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      markConversationAsRead(selectedConversation);
    }
  }, [selectedConversation]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add this useEffect for debugging
  useEffect(() => {
    console.log('🔍 Current state:', {
      selectedConversation,
      currentUser,
      conversationsCount: conversations.length,
      messagesCount: messages.length,
      sendingMessage
    });
  }, [selectedConversation, currentUser, conversations.length, messages.length, sendingMessage]);

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
      console.error('Failed to load messages:', error);
      setError('Failed to load messages');
    }
  };

  const markConversationAsRead = async (conversationId: string) => {
    try {
      await messageService.markAsRead(conversationId);
      // Update conversation unread count
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
    console.log('🚀 handleSendMessage called');
    
    if (!newMessage.trim() || !selectedConversation || !currentUser || sendingMessage) {
      console.log('❌ Send message blocked:', {
        hasMessage: !!newMessage.trim(),
        hasConversation: !!selectedConversation,
        hasCurrentUser: !!currentUser,
        isSending: sendingMessage
      });
      return;
    }
    
    const currentConversation = conversations.find(conv => conv.id === selectedConversation);
    if (!currentConversation) {
      console.error('❌ No current conversation found');
      setError('No conversation selected');
      return;
    }

    const receiverId = currentConversation.user.id;
    
    console.log('🔍 Sending message with data:', {
      conversationId: selectedConversation,
      receiverId: receiverId,
      senderId: currentUser.id,
      content: newMessage.trim(),
      currentConversation
    });

    try {
      setSendingMessage(true);
      setError(null);
      
      // Store message content before clearing
      const messageToSend = newMessage.trim();
      setNewMessage(""); // Clear input immediately
      
      console.log('📤 Calling messageService.sendMessage...');
      
      // Send message to server (no optimistic update for now to debug)
      const sentMessage = await messageService.sendMessage(receiverId, messageToSend);
      
      console.log('✅ Message sent successfully:', sentMessage);
      
      // Add the sent message to the UI
      setMessages(prev => [...prev, sentMessage]);
      
      // Update conversation's last message
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation 
            ? {
                ...conv,
                lastMessage: {
                  id: sentMessage.id,
                  senderId: sentMessage.senderId || sentMessage.sender?.id,
                  content: sentMessage.content,
                  timestamp: sentMessage.timestamp,
                  isRead: sentMessage.isRead
                }
              }
            : conv
        )
      );
      
    } catch (error: any) {
      console.error('❌ Failed to send message:', error);
      
      // Restore the message in input on error
      setNewMessage(messageToSend);
      
      setError(error.message || 'Failed to send message. Please try again.');
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
    <div className="h-[calc(100vh-100px)] flex bg-white/10 rounded-xl overflow-hidden">
      {/* Error Message */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg flex items-center z-50">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-white hover:text-gray-200">×</button>
        </div>
      )}

      {/* Conversations List */}
      <div className="w-1/3 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-white flex items-center">
              <MessageCircle className="w-6 h-6 mr-2 text-pink-400" />
              <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                Messages
              </span>
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
  );
}