import { MessageCircle, Send, Search, MoreVertical, Phone, Video } from "lucide-react";
import { useState } from "react";

interface User {
  id: string;
  name: string;
  avatar: string;
  lastSeen: string;
  isOnline: boolean;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface Conversation {
  id: string;
  user: User;
  lastMessage: Message;
  unreadCount: number;
  messages: Message[];
}

export default function Messenger() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data - replace with real data from your API
  const conversations: Conversation[] = [
    {
      id: "1",
      user: {
        id: "user1",
        name: "Emma Wilson",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150",
        lastSeen: "2 min ago",
        isOnline: true
      },
      lastMessage: {
        id: "msg1",
        senderId: "user1",
        content: "Hey! How are you doing?",
        timestamp: "10:30 AM",
        isRead: false
      },
      unreadCount: 2,
      messages: [
        {
          id: "msg1",
          senderId: "user1",
          content: "Hey! How are you doing?",
          timestamp: "10:30 AM",
          isRead: false
        },
        {
          id: "msg2",
          senderId: "me",
          content: "Hi Emma! I'm doing great, thanks for asking!",
          timestamp: "10:25 AM",
          isRead: true
        }
      ]
    },
    {
      id: "2",
      user: {
        id: "user2",
        name: "Alex Johnson",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        lastSeen: "1 hour ago",
        isOnline: false
      },
      lastMessage: {
        id: "msg3",
        senderId: "me",
        content: "See you tomorrow!",
        timestamp: "Yesterday",
        isRead: true
      },
      unreadCount: 0,
      messages: [
        {
          id: "msg3",
          senderId: "me",
          content: "See you tomorrow!",
          timestamp: "Yesterday",
          isRead: true
        }
      ]
    }
  ];

  const currentConversation = conversations.find(conv => conv.id === selectedConversation);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    // Add message sending logic here
    console.log("Sending message:", newMessage);
    setNewMessage("");
  };

  const filteredConversations = conversations.filter(conv =>
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-100px)] flex bg-white/10 rounded-xl overflow-hidden">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white mb-4 flex items-center">
            <MessageCircle className="w-6 h-6 mr-2 text-pink-400" />
            <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              Messages
            </span>
          </h1>
          
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
                onClick={() => setSelectedConversation(conversation.id)}
                className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors ${
                  selectedConversation === conversation.id ? 'bg-gray-800' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <img
                      src={conversation.user.avatar}
                      alt={conversation.user.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {conversation.user.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-white truncate">{conversation.user.name}</h3>
                      <span className="text-xs text-gray-400">{conversation.lastMessage.timestamp}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-300 truncate">
                        {conversation.lastMessage.content}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2">
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
                    src={currentConversation.user.avatar}
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
              {currentConversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-2 rounded-lg ${
                      message.senderId === 'me'
                        ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white'
                        : 'bg-gray-700 text-white'
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.senderId === 'me' ? 'text-white/70' : 'text-gray-400'
                    }`}>
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-400"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-lg hover:from-violet-600 hover:to-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
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
    </div>
  );
}