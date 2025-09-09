import React, { useState, useEffect } from 'react';
import { Heart, X, Calendar, MessageCircle, Users, Sparkles, Settings, Home as HomeIcon, User, Menu } from 'lucide-react';

// Mock data
const mockUser = {
  id: 1,
  name: "Alex Chen",
  age: 28,
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  matches: 24,
  likes: 156,
  messages: 8,
  upcomingDates: 3
};

const mockProfiles = [
  {
    id: 1,
    name: "Emma Wilson",
    age: 26,
    photo: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=500&fit=crop&crop=face",
    interests: ["Photography", "Hiking", "Coffee"],
    bio: "Adventure seeker and coffee enthusiast"
  },
  {
    id: 2,
    name: "James Rodriguez",
    age: 29,
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&crop=face",
    interests: ["Music", "Travel", "Cooking"],
    bio: "Musician who loves to explore new places"
  },
  {
    id: 3,
    name: "Sophia Kim",
    age: 24,
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&crop=face",
    interests: ["Art", "Yoga", "Reading"],
    bio: "Artist finding beauty in everyday moments"
  },
  {
    id: 4,
    name: "Michael Torres",
    age: 31,
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face",
    interests: ["Fitness", "Movies", "Dogs"],
    bio: "Fitness enthusiast and dog lover"
  }
];

const mockMatches = [
  {
    id: 1,
    name: "Sarah Johnson",
    age: 27,
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    compatibility: 92,
    location: "2 miles away",
    lastActive: "Active now"
  },
  {
    id: 2,
    name: "David Park",
    age: 30,
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
    compatibility: 88,
    location: "5 miles away",
    lastActive: "Active 2h ago"
  }
];

const availableDates = [
  { date: "2024-09-15", time: "7:00 PM", venue: "Coffee Corner" },
  { date: "2024-09-16", time: "2:00 PM", venue: "Art Gallery" },
  { date: "2024-09-18", time: "6:30 PM", venue: "Italian Bistro" },
  { date: "2024-09-20", time: "1:00 PM", venue: "Central Park" }
];

const Home: React.FC = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [likedProfiles, setLikedProfiles] = useState<number[]>([]);

  const handleLike = () => {
    setLikedProfiles([...likedProfiles, mockProfiles[currentProfileIndex].id]);
    setCurrentProfileIndex((prev) => (prev + 1) % mockProfiles.length);
  };

  const handlePass = () => {
    setCurrentProfileIndex((prev) => (prev + 1) % mockProfiles.length);
  };

  const currentProfile = mockProfiles[currentProfileIndex];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation Bar */}
      <nav className="backdrop-blur-md bg-white/5 border-b border-white/10 sticky top-0 z-50">
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
                <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent hover:cursor-pointer" onClick={()=> window.location.reload()}>
                  HappyHeads
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <MessageCircle className="w-6 h-6 text-white/60 cursor-pointer hover:text-violet-400 transition-colors" />
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-r from-violet-400 to-pink-400 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </div>
              <img
                src={mockUser.avatar}
                alt="Profile"
                onClick={() => window.location.href = '/profile'}
                className="w-8 h-8 rounded-full border-2 border-violet-400/50 cursor-pointer hover:border-violet-400 transition-colors"
              />
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <div className={`fixed lg:static inset-y-0 left-0 z-40 w-64 backdrop-blur-md bg-white/5 border-r border-white/10 transform transition-transform lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 pt-20 lg:pt-6">
            <div className="space-y-2">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
                { id: 'feed', label: 'Discover', icon: Sparkles },
                { id: 'matches', label: 'Matches', icon: Users },
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
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Welcome back, {mockUser.name}!</h1>
                  <p className="text-white/60">Let's find your perfect match today</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total Matches', value: mockUser.matches, icon: Heart, color: 'from-violet-400 to-pink-400' },
                  { label: 'Likes Received', value: mockUser.likes, icon: Sparkles, color: 'from-pink-400 to-red-400' },
                  { label: 'Messages', value: mockUser.messages, icon: MessageCircle, color: 'from-blue-400 to-violet-400' },
                  { label: 'Upcoming Dates', value: mockUser.upcomingDates, icon: Calendar, color: 'from-green-400 to-blue-400' }
                ].map((stat, index) => (
                  <div key={index} className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center mb-4`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                    <p className="text-white/60 text-sm">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop&crop=face" alt="" className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <p className="font-medium text-white">Sarah liked your profile</p>
                      <p className="text-sm text-white/60">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 p-4 bg-pink-500/10 border border-pink-500/20 rounded-xl">
                    <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=50&h=50&fit=crop&crop=face" alt="" className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <p className="font-medium text-white">New match with David</p>
                      <p className="text-sm text-white/60">5 hours ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feed Section */}
          {activeSection === 'feed' && (
            <div className="max-w-md mx-auto">
              <h1 className="text-3xl font-bold text-white mb-8 text-center">
                <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                  Discover People
                </span>
              </h1>
              
              <div className="relative">
                <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl overflow-hidden transform transition-all duration-300 hover:scale-105">
                  <div className="relative">
                    <img
                      src={currentProfile.photo}
                      alt={currentProfile.name}
                      className="w-full h-96 object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6">
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {currentProfile.name}, {currentProfile.age}
                      </h2>
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
                    className="w-16 h-16 backdrop-blur-md bg-white/10 border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 transition-all hover:scale-110 active:scale-95"
                  >
                    <X className="w-8 h-8 text-white/70" />
                  </button>
                  <button
                    onClick={handleLike}
                    className="w-16 h-16 bg-gradient-to-r from-violet-500 to-pink-500 rounded-full flex items-center justify-center hover:shadow-lg hover:shadow-violet-500/25 transition-all hover:scale-110 active:scale-95"
                  >
                    <Heart className="w-8 h-8 text-white" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Matches Section */}
          {activeSection === 'matches' && (
            <div className="space-y-8">
              <h1 className="text-3xl font-bold text-white mb-8">
                <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                  Your Matches
                </span>
              </h1>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {mockMatches.map((match) => (
                  <div key={match.id} className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
                    <div className="flex items-center space-x-4 mb-6">
                      <img
                        src={match.photo}
                        alt={match.name}
                        className="w-16 h-16 rounded-full border-4 border-violet-400/50"
                      />
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white">{match.name}, {match.age}</h3>
                        <p className="text-white/60">{match.location}</p>
                        <p className="text-sm text-green-400">{match.lastActive}</p>
                      </div>
                      <div className="text-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${
                          match.compatibility >= 90 ? 'bg-green-500/20 border border-green-500/30 text-green-400' :
                          match.compatibility >= 80 ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400' :
                          'bg-red-500/20 border border-red-500/30 text-red-400'
                        }`}>
                          {match.compatibility}%
                        </div>
                        <p className="text-xs text-white/50 mt-1">Match</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-white mb-3">Available Dates</h4>
                      {availableDates.slice(0, 2).map((dateOption, index) => (
                        <div key={index} className="flex items-center justify-between p-3 backdrop-blur-md bg-violet-500/10 border border-violet-500/20 rounded-xl hover:bg-violet-500/20 transition-colors cursor-pointer">
                          <div className="flex items-center space-x-3">
                            <Calendar className="w-5 h-5 text-violet-400" />
                            <div>
                              <p className="font-medium text-white">{dateOption.date}</p>
                              <p className="text-sm text-white/60">{dateOption.time} • {dateOption.venue}</p>
                            </div>
                          </div>
                          <button className="px-4 py-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all text-sm font-medium">
                            Book
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;