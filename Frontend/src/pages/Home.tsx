const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.BACKEND_A_URL || 'http://localhost:8000';

import React, { useState, useEffect } from 'react';
import { Heart, X, Calendar, MessageCircle, Users, Sparkle, Settings, Home as HomeIcon, User, Menu, LogOut, Bell, Filter, Globe, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Header/Navbar';
import { size } from 'zod/v4';
import Feed from '@/components/Feeds/Feed';
import Notification from '@/components/Notification/Notification';
import Matching from '../components/Matching/Matching';
import Messenger from '@/components/Messenger/Messenger';
import CreatePost from '@/components/Posts/CreatePost';
import { messageService } from '@/services/messageService';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import OptimizedAvatar from '@/components/ui/OptimizedAvatar';
import AccountSettings from '@/components/Settings/AccountSettings';
import MatchingPreferences from '@/components/Settings/MatchingPreferences';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  age?: number;
  phone?: string;
  bio?: string;
  gender?: string;
  googleId?: string;
  avatar?: string;
  college?: string;
  location?: string;
  interests?: string[];
  isVerified?: boolean;
  isPremium?: boolean;
  createdAt?: string;
  updatedAt?: string;
  posts?: any[];
}

interface ProfileCard {
  id: string;
  name: string;
  age?: number;
  photo: string;
  interests: string[];
  bio: string;
  location?: string;
}

// Mock data for profiles to discover (replace with actual API data later)
const mockProfiles: ProfileCard[] = [
  {
    id: "1",
    name: "Emma Wilson",
    age: 26,
    photo: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=500&fit=crop&crop=face",
    interests: ["Photography", "Hiking", "Coffee"],
    bio: "Adventure seeker and coffee enthusiast",
    location: "2 miles away"
  },
  
];

const Home: React.FC = () => {
  const [activeSection, setActiveSection] = useState('feed');
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [likedProfiles, setLikedProfiles] = useState<string[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    matches: 0,
    likes: 0,
    messages: 0,
    profileViews: 0
  });

  // Settings state
  const [activeSettingsTab, setActiveSettingsTab] = useState('account');

  // Use the custom hook for unread counts
  const { counts: unreadCounts, loading: countsLoading } = useUnreadCounts();

  const navigate = useNavigate();

  // Check authentication and load user data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/auth/me`, {
          method: 'GET',
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
            // Load user stats (you can create an API endpoint for this)
            setStats({
              matches: Math.floor(Math.random() * 50) + 10,
              likes: Math.floor(Math.random() * 200) + 50,
              messages: Math.floor(Math.random() * 20) + 5,
              profileViews: Math.floor(Math.random() * 100) + 25
            });
          } else {
            navigate('/');
          }
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // Handle section changes to emit events for badge updates
  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    setSidebarOpen(false);

    // Emit events when user visits messages or notifications sections
    if (sectionId === 'messages') {
      // Reset message count when user visits messages
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('conversation-read'));
      }, 1000); // Small delay to allow the component to load
    } else if (sectionId === 'notifications') {
      // Reset notification count when user visits notifications
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('all-notifications-read'));
      }, 1000); // Small delay to allow the component to load
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/');
    }
  };

  const handleLike = () => {
    const currentProfile = mockProfiles[currentProfileIndex];
    setLikedProfiles([...likedProfiles, currentProfile.id]);
    setCurrentProfileIndex((prev) => (prev + 1) % mockProfiles.length);
    // Here you would typically send a like to your backend
  };

  const handlePass = () => {
    setCurrentProfileIndex((prev) => (prev + 1) % mockProfiles.length);
    // Here you would typically send a pass to your backend
  };

  const goToProfile = () => {
    navigate('/home');
  };

  const handlePostCreated = (newPost: any) => {
    setUserPosts(prev => [newPost, ...prev]);
    // Switch to feed tab to show the new post
    setActiveSection('feed');
  };

  const handleUserUpdate = (updatedUser: any) => {
    setUser(updatedUser);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const currentProfile = mockProfiles[currentProfileIndex];
  const firstName = user.name?.split(' ')[0] || user.email?.split('@')[0] || 'User';

  // Component for rendering menu items with badges
  const MenuItemWithBadge = ({ item, unreadCount }: { item: any; unreadCount?: number }) => (
    <button
      key={item.id}
      onClick={() => handleSectionChange(item.id)}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
        activeSection === item.id
          ? 'bg-blue-500 text-white shadow-lg'
          : 'text-white/60 hover:bg-white/5 hover:text-blue-400'
      }`}
    >
      <div className="flex items-center space-x-3">
        <item.icon size={20} />
        <span className="font-medium">{item.label}</span>
      </div>
      {unreadCount > 0 && (
        <div className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
    </button>
  );

  return (
    <div>
      <div className="min-h-screen bg-black text-white">
        <div className='pt-20 bg-black'>
          <Navbar />
        </div>
        <div className="flex">
          {/* Sidebar */}
          <div className={`fixed lg:static inset-y-0 left-0 z-40 w-64 backdrop-blur-md bg-white/5 border-r border-white/10 transform transition-transform lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-6 pt-20 lg:pt-6">
              {/* User Info */}
              <div className="mb-8 p-4 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center space-x-3">
                  <OptimizedAvatar 
                    src={user.avatar} 
                    alt="User Avatar" 
                    fallbackText={user.name || user.email?.split('@')[0] || "U"}
                    size="md"
                    className="cursor-pointer"
                    lazy={false}
                  />
                  <div>
                    <h3 className="font-semibold text-white">{firstName}</h3>
                    <p className="text-sm text-white/60">College Student</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { id: 'feed', label: 'Feed', icon: HomeIcon },
                  { id: 'post', label: 'Create Post', icon: Sparkle },
                  { id: 'matches', label: 'Matches', icon: Users },
                  { id: 'notifications', label: 'Notifications', icon: Bell },
                  { id: 'messages', label: 'Messages', icon: MessageCircle },
                  { id: 'settings', label: 'Settings', icon: Settings },
                ].map((item) => {
                  // Determine unread count for this item using the hook
                  let unreadCount = 0;
                  if (item.id === 'messages') {
                    unreadCount = unreadCounts.messages;
                  } else if (item.id === 'notifications') {
                    unreadCount = unreadCounts.notifications;
                  }

                  return <MenuItemWithBadge key={item.id} item={item} unreadCount={unreadCount} />;
                })}
              </div>
            </div>
          </div>

          {/* Overlay for mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            ></div>
          )}

          {/* Main Content */}
          <div className="flex-1 p-4 lg:p-8">
            {/* Feed Section */}
            {activeSection === 'feed' && (
              <Feed />
            )}

            {/* Create Post Section */}
            {activeSection === 'post' && (
              <div className="space-y-8">
                <h1 className="text-3xl font-bold text-white mb-8 flex items-center">
                  <Sparkle className="w-8 h-8 mr-3 text-blue-400" />
                  <span className="text-blue-400">
                    Update Profile Gallery
                  </span>
                </h1>
                
                <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 bg-blue-500 rounded-xl">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Profile Image Gallery</h3>
                      <p className="text-white/60 text-sm">Upload images to your profile to showcase your personality and interests</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2 text-white/50 text-sm">
                    <Globe className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>These images will appear on your profile gallery and help potential matches get to know you better. They won't appear in the public feed.</p>
                  </div>
                </div>
                
                <CreatePost onPostCreated={handlePostCreated} user={user} />
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <Notification/>
            )}

            {/* Matches Section */}
            {activeSection === 'matches' && (
              <Matching/>
            )}

            {/* Messages Section */}
            {activeSection === 'messages' && (
              <Messenger/>
            )}

            {/* Settings Section */}
            {activeSection === 'settings' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between mb-8">
                  <h1 className="text-3xl font-bold text-white flex items-center">
                    <Settings className="w-8 h-8 mr-3 text-blue-400" />
                    <span className="text-blue-400">
                      Settings
                    </span>
                  </h1>
                </div>

                {/* Settings Navigation Tabs */}
                <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-2">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'account', label: 'Account & Profile', icon: User },
                      { id: 'matching', label: 'Matching Preferences', icon: Heart },
                      { id: 'privacy', label: 'Privacy & Security', icon: Shield },
                      { id: 'notifications', label: 'Notifications', icon: Bell }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveSettingsTab(tab.id)}
                        className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          activeSettingsTab === tab.id
                            ? 'bg-blue-500 text-white shadow-lg'
                            : 'text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <tab.icon className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Settings Content */}
                <div className="min-h-[600px]">
                  {activeSettingsTab === 'account' && (
                    <AccountSettings user={user} onUpdate={handleUserUpdate} />
                  )}
                  
                  {activeSettingsTab === 'matching' && (
                    <MatchingPreferences user={user} />
                  )}

                  {activeSettingsTab === 'privacy' && (
                    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
                      <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                        <Shield className="w-5 h-5 mr-3 text-green-400" />
                        Privacy & Security Settings
                      </h3>
                      
                      <div className="space-y-6">
                        {/* Profile Visibility */}
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold text-white">Profile Visibility</h4>
                          <div className="space-y-3">
                            <label className="flex items-center justify-between">
                              <div>
                                <span className="text-white font-medium">Show Profile to Everyone</span>
                                <p className="text-white/60 text-sm">Your profile will be visible to all users</p>
                              </div>
                              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-500">
                                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                              </button>
                            </label>
                            
                            <label className="flex items-center justify-between">
                              <div>
                                <span className="text-white font-medium">Show Age</span>
                                <p className="text-white/60 text-sm">Display your age on your profile</p>
                              </div>
                              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-500">
                                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                              </button>
                            </label>

                            <label className="flex items-center justify-between">
                              <div>
                                <span className="text-white font-medium">Show Location</span>
                                <p className="text-white/60 text-sm">Show your approximate location to others</p>
                              </div>
                              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-500">
                                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                              </button>
                            </label>

                            <label className="flex items-center justify-between">
                              <div>
                                <span className="text-white font-medium">Allow Direct Messages</span>
                                <p className="text-white/60 text-sm">Let matched users send you messages</p>
                              </div>
                              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-500">
                                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                              </button>
                            </label>
                          </div>
                        </div>

                        {/* Account Security */}
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold text-white">Account Security</h4>
                          <div className="space-y-3">
                            <button className="w-full text-left p-4 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-white font-medium">Change Password</span>
                                  <p className="text-white/60 text-sm">Update your account password</p>
                                </div>
                                <span className="text-blue-400">→</span>
                              </div>
                            </button>
                            
                            <button className="w-full text-left p-4 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-white font-medium">Two-Factor Authentication</span>
                                  <p className="text-white/60 text-sm">Add an extra layer of security</p>
                                </div>
                                <span className="text-white/40 text-sm">Not enabled</span>
                              </div>
                            </button>

                            <button className="w-full text-left p-4 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-white font-medium">Connected Accounts</span>
                                  <p className="text-white/60 text-sm">Manage linked social accounts</p>
                                </div>
                                <span className="text-blue-400">→</span>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSettingsTab === 'notifications' && (
                    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
                      <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                        <Bell className="w-5 h-5 mr-3 text-blue-400" />
                        Notification Settings
                      </h3>
                      
                      <div className="space-y-6">
                        {/* Push Notifications */}
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold text-white">Push Notifications</h4>
                          <div className="space-y-3">
                            {[
                              { label: 'New Messages', desc: 'Get notified when you receive new messages', enabled: true },
                              { label: 'New Matches', desc: 'Get notified when you have a new match', enabled: true },
                              { label: 'Profile Likes', desc: 'Get notified when someone likes your profile', enabled: false },
                              { label: 'Post Comments', desc: 'Get notified when someone comments on your posts', enabled: true },
                              { label: 'Post Likes', desc: 'Get notified when someone likes your posts', enabled: false }
                            ].map((notification, index) => (
                              <label key={index} className="flex items-center justify-between">
                                <div>
                                  <span className="text-white font-medium">{notification.label}</span>
                                  <p className="text-white/60 text-sm">{notification.desc}</p>
                                </div>
                                <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  notification.enabled 
                                    ? 'bg-blue-500' 
                                    : 'bg-white/20'
                                }`}>
                                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    notification.enabled ? 'translate-x-6' : 'translate-x-1'
                                  }`} />
                                </button>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Email Notifications */}
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold text-white">Email Notifications</h4>
                          <div className="space-y-3">
                            {[
                              { label: 'Weekly Summary', desc: 'Get a weekly summary of your activity', enabled: true },
                              { label: 'Security Alerts', desc: 'Important security notifications', enabled: true },
                              { label: 'Product Updates', desc: 'New features and updates', enabled: false },
                              { label: 'Marketing Emails', desc: 'Promotional content and offers', enabled: false }
                            ].map((notification, index) => (
                              <label key={index} className="flex items-center justify-between">
                                <div>
                                  <span className="text-white font-medium">{notification.label}</span>
                                  <p className="text-white/60 text-sm">{notification.desc}</p>
                                </div>
                                <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  notification.enabled 
                                    ? 'bg-blue-500' 
                                    : 'bg-white/20'
                                }`}>
                                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    notification.enabled ? 'translate-x-6' : 'translate-x-1'
                                  }`} />
                                </button>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;