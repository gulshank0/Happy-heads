import React, { useState, useEffect } from 'react';
import { Heart, X, Calendar, MessageCircle, Users, Sparkles, Settings, Home as HomeIcon, User, Menu, LogOut, Bell, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Header/Navbar';

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
  {
    id: "2",
    name: "James Rodriguez",
    age: 29,
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&crop=face",
    interests: ["Music", "Travel", "Cooking"],
    bio: "Musician who loves to explore new places",
    location: "3 miles away"
  },
  {
    id: "3",
    name: "Sophia Kim",
    age: 24,
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&crop=face",
    interests: ["Art", "Yoga", "Reading"],
    bio: "Artist finding beauty in everyday moments",
    location: "1 mile away"
  },
  {
    id: "4",
    name: "Michael Torres",
    age: 31,
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face",
    interests: ["Fitness", "Movies", "Dogs"],
    bio: "Fitness enthusiast and dog lover",
    location: "4 miles away"
  }
];

const Home: React.FC = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [likedProfiles, setLikedProfiles] = useState<string[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
      {/* Navigation Bar */}
      {/* <nav className="backdrop-blur-md bg-white/5 border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-xl text-white/60 hover:bg-white/5 transition-colors"
              >
                <Menu size={20} />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-violet-400 to-pink-400 rounded-xl flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <span 
                  className="text-xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent hover:cursor-pointer" 
                  onClick={() => setActiveSection('dashboard')}
                >
                  Happy Heads
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell className="w-6 h-6 text-white/60 cursor-pointer hover:text-violet-400 transition-colors" />
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-r from-violet-400 to-pink-400 text-white text-xs rounded-full flex items-center justify-center">
                  {stats.messages}
                </span>
              </div>
              <div className="relative">
                <MessageCircle className="w-6 h-6 text-white/60 cursor-pointer hover:text-violet-400 transition-colors" />
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-r from-violet-400 to-pink-400 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div 
                  onClick={goToProfile}
                  className="w-8 h-8 bg-gradient-to-r from-violet-400 to-pink-400 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                >
                  <User className="w-5 h-5 text-white" />
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-white/60 hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav> */}

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
                { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
                { id: 'discover', label: 'Discover', icon: Sparkles },
                { id: 'matches', label: 'Matches', icon: Users },
                { id: 'messages', label: 'Messages', icon: MessageCircle },
                { id: 'settings', label: 'Settings', icon: Settings }
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
          {/* Dashboard Section */}
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-violet-400 to-pink-400 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Welcome back, {firstName}!</h1>
                  <p className="text-white/60">Ready to find your perfect match today?</p>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Profile Views', value: stats.profileViews, icon: User, color: 'from-violet-400 to-pink-400' },
                  { label: 'Likes Received', value: stats.likes, icon: Heart, color: 'from-pink-400 to-red-400' },
                  { label: 'Matches', value: stats.matches, icon: Users, color: 'from-blue-400 to-violet-400' },
                  { label: 'Messages', value: stats.messages, icon: MessageCircle, color: 'from-green-400 to-blue-400' }
                ].map((stat, index) => (
                  <div key={index} className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all cursor-pointer group">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                    <p className="text-white/60 text-sm">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Sparkles className="w-6 h-6 mr-2 text-violet-400" />
                    Quick Actions
                  </h2>
                  <div className="space-y-3">
                    <button
                      onClick={() => setActiveSection('discover')}
                      className="w-full p-4 bg-gradient-to-r from-violet-500 to-pink-500 rounded-xl text-white font-medium hover:shadow-lg hover:shadow-violet-500/25 transition-all"
                    >
                      Start Discovering
                    </button>
                    <button
                      onClick={goToProfile}
                      className="w-full p-4 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl text-white font-medium hover:bg-white/20 transition-all"
                    >
                      Complete Profile
                    </button>
                  </div>
                </div>

                <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Bell className="w-6 h-6 mr-2 text-pink-400" />
                    Recent Activity
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                      <div className="w-10 h-10 bg-gradient-to-r from-violet-400 to-pink-400 rounded-full flex items-center justify-center">
                        <Heart className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white">Someone liked your profile</p>
                        <p className="text-sm text-white/60">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 p-3 bg-pink-500/10 border border-pink-500/20 rounded-xl">
                      <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-red-400 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white">New match available</p>
                        <p className="text-sm text-white/60">5 hours ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Discover Section */}
          {activeSection === 'discover' && (
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-white">
                  <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                    Discover People
                  </span>
                </h1>
                <button className="p-2 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all">
                  <Filter className="w-5 h-5 text-white/60" />
                </button>
              </div>
              
              <div className="relative">
                <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl overflow-hidden transform transition-all duration-300 hover:scale-105 shadow-2xl">
                  <div className="relative">
                    <img
                      src={currentProfile.photo}
                      alt={currentProfile.name}
                      className="w-full h-96 object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-2xl font-bold text-white">
                          {currentProfile.name}
                          {currentProfile.age && <span className="text-white/80">, {currentProfile.age}</span>}
                        </h2>
                        {currentProfile.location && (
                          <span className="text-sm text-white/60 bg-white/20 px-2 py-1 rounded-full">
                            {currentProfile.location}
                          </span>
                        )}
                      </div>
                      <p className="text-white/90 mb-3">{currentProfile.bio}</p>
                      <div className="flex flex-wrap gap-2">
                        {currentProfile.interests.map((interest, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 backdrop-blur-md bg-white/20 border border-white/30 rounded-full text-white text-sm"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center space-x-6 mt-8">
                  <button
                    onClick={handlePass}
                    className="w-16 h-16 backdrop-blur-md bg-white/10 border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 transition-all hover:scale-110 active:scale-95 group"
                  >
                    <X className="w-8 h-8 text-white/70 group-hover:text-red-400 transition-colors" />
                  </button>
                  <button
                    onClick={handleLike}
                    className="w-16 h-16 bg-gradient-to-r from-violet-500 to-pink-500 rounded-full flex items-center justify-center hover:shadow-lg hover:shadow-violet-500/25 transition-all hover:scale-110 active:scale-95"
                  >
                    <Heart className="w-8 h-8 text-white" />
                  </button>
                </div>

                <div className="text-center mt-6">
                  <p className="text-white/60 text-sm">
                    {mockProfiles.length - currentProfileIndex - 1} more profiles to discover
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Matches Section */}
          {activeSection === 'matches' && (
            <div className="space-y-8">
              <h1 className="text-3xl font-bold text-white mb-8 flex items-center">
                <Users className="w-8 h-8 mr-3 text-violet-400" />
                <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                  Your Matches
                </span>
              </h1>
              
              {likedProfiles.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-r from-violet-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Heart className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-4">No matches yet</h2>
                  <p className="text-white/60 mb-8">Start discovering people to find your perfect match!</p>
                  <button
                    onClick={() => setActiveSection('discover')}
                    className="px-6 py-3 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all font-medium"
                  >
                    Start Discovering
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {likedProfiles.map((profileId) => {
                    const profile = mockProfiles.find(p => p.id === profileId);
                    if (!profile) return null;
                    
                    return (
                      <div key={profile.id} className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all group">
                        <div className="relative">
                          <img
                            src={profile.photo}
                            alt={profile.name}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute top-4 right-4 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                            New Match!
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-bold text-white mb-1">
                            {profile.name}
                            {profile.age && <span className="text-white/80">, {profile.age}</span>}
                          </h3>
                          <p className="text-white/60 text-sm mb-3">{profile.bio}</p>
                          <button className="w-full py-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all font-medium">
                            Send Message
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Messages Section */}
          {activeSection === 'messages' && (
            <div className="space-y-8">
              <h1 className="text-3xl font-bold text-white mb-8 flex items-center">
                <MessageCircle className="w-8 h-8 mr-3 text-pink-400" />
                <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                  Messages
                </span>
              </h1>
              
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-r from-violet-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">No messages yet</h2>
                <p className="text-white/60 mb-8">Start matching with people to begin conversations!</p>
              </div>
            </div>
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