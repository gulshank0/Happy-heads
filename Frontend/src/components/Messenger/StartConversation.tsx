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

export default function StartConversation({ isOpen, onClose, onConversationCreated }: StartConversationProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search function
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  const searchUsers = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setUsers([]);
        return;
      }

      try {
        setSearchLoading(true);
        setError(null);
        
        const response = await fetch(
          `http://localhost:8000/users/search?q=${encodeURIComponent(query)}`,
          {
            credentials: 'include'
          }
        );

        if (!response.ok) {
          throw new Error('Failed to search users');
        }

        const data = await response.json();
        
        if (data.success) {
          setUsers(data.users || []);
        } else {
          setError(data.error || 'Failed to search users');
        }
      } catch (error) {
        console.error('Search users error:', error);
        setError('Failed to search users');
        setUsers([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300),
    []
  );

  const loadInitialUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:8000/users?limit=10', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load users');
      }

      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users || []);
      } else {
        setError(data.error || 'Failed to load users');
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (searchQuery.trim()) {
        searchUsers(searchQuery);
      } else {
        loadInitialUsers();
      }
    } else {
      // Reset state when modal closes
      setUsers([]);
      setSearchQuery('');
      setError(null);
    }
  }, [isOpen, searchQuery, searchUsers]);

  const handleStartConversation = async (userId: string) => {
    try {
      setCreating(userId);
      setError(null);
      
      const conversation = await messageService.createConversation(userId);
      onConversationCreated(conversation.id);
      onClose();
    } catch (error) {
      console.error('Failed to create conversation:', error);
      setError('Failed to create conversation');
    } finally {
      setCreating(null);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
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

        {/* Search */}
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
                {searchQuery.trim() ? 'No users found' : 'No users available'}
              </h3>
              <p className="text-gray-500 text-sm">
                {searchQuery.trim() 
                  ? 'Try searching with different keywords'
                  : 'Start typing to search for users'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors group"
                  onClick={() => handleStartConversation(user.id)}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={user.avatar || '/default-avatar.png'}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {user.hasExistingConversation && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  
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
                  
                  <div className="flex-shrink-0">
                    {creating === user.id ? (
                      <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <MessageCircle className="w-5 h-5 text-violet-400 group-hover:text-violet-300 transition-colors" />
                    )}
                  </div>
                </div>
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