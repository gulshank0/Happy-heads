import React, { useState, useEffect } from 'react';
import { Heart, X, Calendar, MessageCircle, Users, Sparkle, Settings, Home as HomeIcon, User, Menu, LogOut, Bell, Filter, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Header/Navbar';
import { size } from 'zod/v4';
import Feed from '@/components/Feeds/Feed';
import Notification from '@/components/Notification/Notification';
import Matching from '../components/Matching/Matching';
import Messenger from '@/components/Messenger/Messenger';
import CreatePost from '@/components/Posts/CreatePost';

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
  createdAt?: string;
  updatedAt?: string;
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

  const navigate = useNavigate();

  // Check authentication and load user data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('http://localhost:8000/auth/me', {
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

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:8000/auth/logout', {
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
    navigate('/profile');
  };

  const handlePostCreated = (newPost: any) => {
    setUserPosts(prev => [newPost, ...prev]);
    // Switch to feed tab to show the new post
    setActiveSection('feed');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-violet-400 mx-auto mb-4"></div>
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
                  <div className="w-12 h-12 bg-gradient-to-r from-violet-400 to-pink-400 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                    {user.avatar && <img src={user.avatar} alt="User Avatar" className="inline-block w-15 h-15 rounded-full hover:cursor-pointer" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{user.name || user.email?.split('@')[0] || 'User'}</h3>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { id: 'feed', label: 'Feed', icon: HomeIcon },
                  { id: 'post', label: 'Create Post', icon: Sparkle },
                  { id: 'matches', label: 'Matches', icon: Users },
                  {id:'notifications', label:'Notifications', icon: Bell},
                  { id: 'messages', label: 'Messages', icon: MessageCircle },
                  { id: 'settings', label: 'Settings', icon: Settings },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                      activeSection === item.id
                        ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-lg'
                        : 'text-white/60 hover:bg-white/5 hover:text-violet-400'
                    }`}
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
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
                  <Sparkle className="w-8 h-8 mr-3 text-violet-400" />
                  <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                    Create a Post
                  </span>
                </h1>
                
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
                <h1 className="text-3xl font-bold text-white mb-8 flex items-center">
                  <Settings className="w-8 h-8 mr-3 text-violet-400" />
                  <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                    Settings
                  </span>
                </h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Account Settings</h3>
                    <div className="space-y-3">
                      <button
                        onClick={goToProfile}
                        className="w-full text-left p-3 hover:bg-white/5 rounded-xl transition-colors text-white/80 hover:text-white"
                      >
                        Edit Profile
                      </button>
                      <button className="w-full text-left p-3 hover:bg-white/5 rounded-xl transition-colors text-white/80 hover:text-white">
                        Privacy Settings
                      </button>
                      <button className="w-full text-left p-3 hover:bg-white/5 rounded-xl transition-colors text-white/80 hover:text-white">
                        Notification Preferences
                      </button>
                    </div>
                  </div>

                  <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">App Preferences</h3>
                    <div className="space-y-3">
                      <button className="w-full text-left p-3 hover:bg-white/5 rounded-xl transition-colors text-white/80 hover:text-white">
                        Discovery Settings
                      </button>
                      <button className="w-full text-left p-3 hover:bg-white/5 rounded-xl transition-colors text-white/80 hover:text-white">
                        Distance Preferences
                      </button>
                      <button className="w-full text-left p-3 hover:bg-white/5 rounded-xl transition-colors text-white/80 hover:text-white">
                        Age Range
                      </button>
                    </div>
                  </div>
                </div>

                <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Account Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left p-3 hover:bg-red-500/10 rounded-xl transition-colors text-red-400 hover:text-red-300"
                    >
                      Logout
                    </button>
                  </div>
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