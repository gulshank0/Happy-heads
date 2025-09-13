import { useState, useEffect, useCallback } from 'react';
import { Search, MessageCircle, X, Users, CheckCircle } from 'lucide-react';
import { messageService } from '../../services/messageService';

interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
  bio?: string;
  age?: number;
  hasExistingConversation?: boolean;
}

interface StartConversationProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
}

export default function StartConversation({
  isOpen,
  onClose,
  onConversationCreated
}: StartConversationProps) {
  // -------------------------
  // 🔧 State
  // -------------------------
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------
  // ⏱️ Debounce Utility
  // -------------------------
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  // -------------------------
  // 🔍 Search Users
  // -------------------------
  const searchUsers = useCallback(
     debounce(async (query: string) => {
      if (!query.trim()) {
        setUsers([]);
        return;
      }

      try {
        setSearchLoading(true);
        setError(null);

        console.log('🔍 Searching for users with query:', query);
        const users = await messageService.searchUsers(query);
        console.log('✅ Search completed, found users:', users.length);
        setUsers(users);
      } catch (error) {
        console.error('Search users error:', error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to search users. Please check your connection.';
        setError(errorMessage);
        setUsers([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300),
    []

  );

  // -------------------------
  // 🔄 Load Initial Users
  // -------------------------
  const loadInitialUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Loading initial users...');
      console.log('🌐 API Base URL:', import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000');

      const users = await messageService.searchUsers('');
      console.log('✅ Initial users loaded:', users.length);
      setUsers(users);
    } catch (error) {
      console.error('Failed to load users:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load users. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // 🧪 Test Backend Connection
  // -------------------------
  const testBackendConnection = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/users/test-db`,
        { credentials: 'include' }
      );
      const data = await response.json();
      console.log('🔍 Backend test:', data);
    } catch (error) {
      console.error('❌ Backend test failed:', error);
    }
  };

  // -------------------------
  // 🧪 Test Simple Search
  // -------------------------
  const testSimpleSearch = async () => {
    try {
      const response = await fetch('http://localhost:8000/users/search-messaging?q=', {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      setUsers(data);
    } catch (error) {
      console.error('Simple search error:', error);
    }
  };

  // -------------------------
  // 📦 Effects
  // -------------------------
  useEffect(() => {
    if (isOpen) {
      testBackendConnection();

      if (searchQuery.trim()) {
        searchUsers(searchQuery);
      } else {
        loadInitialUsers();
      }
    } else {
      setUsers([]);
      setSearchQuery('');
      setError(null);
    }
  }, [isOpen, searchQuery, searchUsers]);

  // -------------------------
  // ➕ Start Conversation
  // -------------------------
  const handleStartConversation = async (userId: string) => {
    try {
      setCreating(userId);
      setError(null);

      const conversation = await messageService.createConversation(userId);
      onConversationCreated(conversation.id);
      onClose();
    } catch (error: any) {
      console.error('Failed to create conversation:', error);
      setError(error?.message || 'Failed to create conversation');
    } finally {
      setCreating(null);
    }
  };

  // -------------------------
  // 🔠 Handle Input Change
  // -------------------------
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // -------------------------
  // 🚫 Modal Closed
  // -------------------------
  if (!isOpen) return null;

  // -------------------------
  // 🧱 Render Component
  // -------------------------
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Start New Conversation</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-3 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-400"
          />
          {searchLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-400">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <h3 className="text-gray-400 font-medium mb-1">
                {searchQuery.trim() ? 'No users found' : 'Start typing to search'}
              </h3>
              <p className="text-gray-500 text-sm">
                {searchQuery.trim()
                  ? 'Try searching with different keywords'
                  : 'Search for users by name or email'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <button
                  key={user.id}
                  className="w-full flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-lg transition-colors group text-left"
                  onClick={() => handleStartConversation(user.id)}
                  disabled={creating === user.id}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {user.hasExistingConversation && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-white truncate">
                        {user.name || 'Unknown User'}
                      </h3>
                      {user.age && (
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {user.age}y
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 truncate">{user.email}</p>
                    {user.bio && (
                      <p className="text-xs text-gray-500 truncate mt-1">{user.bio}</p>
                    )}
                    {user.hasExistingConversation && (
                      <p className="text-xs text-green-400 mt-1">Existing conversation</p>
                    )}
                  </div>

                  {/* Spinner */}
                  {creating === user.id && (
                    <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            {users.length > 0 && `Found ${users.length} user${users.length === 1 ? '' : 's'}`}
            {searchQuery.trim() && ` matching "${searchQuery}"`}
          </p>
        </div>
      </div>
    </div>
  );
}