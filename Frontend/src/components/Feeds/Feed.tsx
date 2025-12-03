/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BACKEND_URL: string;
  // add more env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.BACKEND_A_URL || 'http://localhost:8000';

import React, { useState, useEffect } from 'react';
import { Heart, X, Filter, MapPin, GraduationCap, Calendar, MessageCircle, Star, Bookmark, Share2, MoreVertical, Zap, Users, Clock, Plus } from 'lucide-react';
import PostCreation from '../PostCreation/PostCreation';
import CommentSection from '../Comments/CommentSection';

interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userAge: number;
  userCollege: string;
  userLocation: string;
  content: string;
  image?: string;
  timestamp: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  isBookmarked: boolean;
  tags: string[];
  privacy: 'public' | 'matches' | 'friends';
}

interface UserProfile {
  id: string;
  name: string;
  age: number;
  location: string;
  college: string;
  major: string;
  year: number;
  bio: string;
  interests: string[];
  photos: string[];
  isVerified: boolean;
  isOnline: boolean;
  lastSeen: string;
  distance: string;
  mutualFriends: number;
  compatibility: number;
}

export default function Feed() {
  const [activeTab, setActiveTab] = useState<'discover' | 'posts'>('discover');
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [showPostCreation, setShowPostCreation] = useState(false);
  const [filters, setFilters] = useState({
    ageRange: [18, 30],
    distance: 50,
    interests: [] as string[],
    college: '',
    online: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [visibleComments, setVisibleComments] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<{id: string, content: string} | null>(null);
  const [swipeLoading, setSwipeLoading] = useState(false);
  const [matchPopup, setMatchPopup] = useState<UserProfile | null>(null);
  
  
  // Fetch real posts from API
  const fetchPosts = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching posts from:', `${BACKEND_URL}/posts/feed`);
      
      const response = await fetch(`${BACKEND_URL}/posts/feed`, {
        credentials: 'include',
        method: 'GET'
      });

      console.log('📡 Posts response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Received posts data:', data);
        setPosts(data);
      } else {
        console.error('Failed to fetch posts, status:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  

  const handleDeletePost = async (postId: string) => {
    try {
      await fetch(`${BACKEND_URL}/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };




  // Fetch real profiles from API using the discovery endpoint
  const fetchProfiles = async () => {
    try {
      setProfilesLoading(true);
      setError('');
      
      console.log('🔍 Fetching profiles from:', `${BACKEND_URL}/users?limit=10`);
      
      const response = await fetch(`${BACKEND_URL}/api/matching/discover?limit=10`, {
        credentials: 'include'
      });

      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Received data:', data);
        
        // Transform the API data to match our UserProfile interface
        const transformedProfiles = data.users?.map((user: any) => ({
          id: user.id,
          name: user.name,
          age: user.age,
          location: user.location ? `${user.location.latitude}, ${user.location.longitude}` : 'Unknown',
          college: user.college,
          major: user.major,
          year: user.year,
          bio: user.bio,
          interests: user.interests || [],
          photos: [user.avatar || `https://api.dicebear.com/8.x/lorelei/svg?seed=${user.name}`],
          isVerified: false,
          isOnline: Math.random() > 0.5, // Random for demo
          lastSeen: '2 hours ago',
          distance: `${Math.floor(Math.random() * 20) + 1} km`,
          mutualFriends: Math.floor(Math.random() * 5),
          compatibility: Math.floor(Math.random() * 40) + 60 // 60-100% compatibility
        })) || [];
        
        console.log('✅ Transformed profiles:', transformedProfiles.length, 'profiles');
        setProfiles(transformedProfiles);
        setCurrentProfileIndex(0); // Reset to first profile
        
        if (transformedProfiles.length === 0) {
          setError('No more profiles to discover. Check back later!');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to fetch profiles:', response.status, errorData);
        setError(errorData.error || 'Failed to load profiles');
      }
    } catch (error) {
      console.error('🔥 Error fetching profiles:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setProfilesLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchProfiles();
  }, []);

  const handlePostCreated = () => {
    fetchPosts(); // Refresh posts after creating a new one
  };

  // Enhanced swipe handlers with real API calls
  const handleSwipe = async (action: 'like' | 'pass') => {
    if (!currentProfile || swipeLoading) return;

    setSwipeLoading(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/matching/swipe`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: currentProfile.id,
          action
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.isMatch && action === 'like') {
          setMatchPopup(currentProfile);
        }
        
        // Move to next profile
        if (currentProfileIndex < profiles.length - 1) {
          setCurrentProfileIndex(currentProfileIndex + 1);
        } else {
          // Reload more profiles when running out
          await fetchProfiles();
          setCurrentProfileIndex(0);
        }
      } else {
        console.error('Swipe failed');
        alert('Failed to process your action. Please try again.');
      }
    } catch (error) {
      console.error('Error handling swipe:', error);
      alert('Network error. Please try again.');
    } finally {
      setSwipeLoading(false);
    }
  };

  const handleLike = () => handleSwipe('like');
  const handlePass = () => handleSwipe('pass');

  const handleSuperLike = async () => {
    if (!currentProfile || swipeLoading) return;
    
    // For now, treat super like as a regular like with special feedback
    setSwipeLoading(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/matching/swipe`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: currentProfile.id,
          action: 'like'
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.isMatch) {
          setMatchPopup(currentProfile);
        } else {
          alert('Super Like sent! ⚡ You stand out from the crowd!');
        }
        
        // Move to next profile
        if (currentProfileIndex < profiles.length - 1) {
          setCurrentProfileIndex(currentProfileIndex + 1);
        } else {
          await fetchProfiles();
          setCurrentProfileIndex(0);
        }
      } else {
        alert('Failed to send Super Like. Please try again.');
      }
    } catch (error) {
      console.error('Error sending super like:', error);
      alert('Network error. Please try again.');
    } finally {
      setSwipeLoading(false);
    }
  };

  const handlePostLike = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
  
    // Optimistic UI update
    setPosts(posts.map(p =>
      p.id === postId
        ? {
            ...p,
            isLiked: !p.isLiked,
            likes: !isNaN(Number(p.likes))
              ? (p.isLiked ? p.likes - 1 : p.likes + 1)
              : 0
          }
        : p
    ));
  
    try {
      const endpoint = post.isLiked ? 'unlike' : 'like';
      await fetch(`${BACKEND_URL}/posts/${postId}/${endpoint}`, {
        method: 'POST',
        credentials: 'include'
      });
      // Optionally, re-fetch posts for consistency
      // fetchPosts();
    } catch (error) {
      // Rollback UI if needed
      setPosts(posts);
      alert('Failed to update like. Please try again.');
    }
  };

  const handlePostBookmark = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, isBookmarked: !post.isBookmarked }
        : post
    ));
  };

  const toggleComments = (postId: string) => {
    setVisibleComments(prev => (prev === postId ? null : postId));
  };

  const handleEditPost = async (postId: string, newContent: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ content: newContent })
      });

      if (response.ok) {
        // Update the post in the local state
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, content: newContent }
            : post
        ));
        setEditingPost(null);
      } else {
        alert('Failed to update post');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post');
    }
  };

  const currentProfile = profiles[currentProfileIndex];

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'discover'
                ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-lg'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Discover
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'posts'
                ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-lg'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <MessageCircle className="w-4 h-4 inline mr-2" />
            Posts
          </button>
        </div>

        <div className="flex space-x-2">
          {activeTab === 'posts' && (
            <button
              onClick={() => setShowPostCreation(true)}
              className="p-3 bg-gradient-to-r from-violet-500 to-pink-500 rounded-xl hover:from-violet-600 hover:to-pink-600 transition-all shadow-lg shadow-violet-500/25"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          )}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="p-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all"
          >
            <Filter className="w-5 h-5 text-white/60" />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/70 text-sm mb-2">Age Range</label>
              <div className="flex space-x-2">
                <input 
                  type="number" 
                  placeholder="Min" 
                  className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  value={filters.ageRange[0]}
                  onChange={(e) => setFilters({...filters, ageRange: [parseInt(e.target.value), filters.ageRange[1]]})}
                />
                <input 
                  type="number" 
                  placeholder="Max" 
                  className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  value={filters.ageRange[1]}
                  onChange={(e) => setFilters({...filters, ageRange: [filters.ageRange[0], parseInt(e.target.value)]})}
                />
              </div>
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">Distance (km)</label>
              <input 
                type="range" 
                min="1" 
                max="100" 
                value={filters.distance}
                onChange={(e) => setFilters({...filters, distance: parseInt(e.target.value)})}
                className="w-full"
              />
              <span className="text-white/60 text-sm">{filters.distance} km</span>
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">College</label>
              <input 
                type="text" 
                placeholder="Search college..."
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                value={filters.college}
                onChange={(e) => setFilters({...filters, college: e.target.value})}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="online" 
                checked={filters.online}
                onChange={(e) => setFilters({...filters, online: e.target.checked})}
                className="rounded"
              />
              <label htmlFor="online" className="text-white/70 text-sm">Online only</label>
            </div>
          </div>
        </div>
      )}

      {/* Discover Tab */}
      {activeTab === 'discover' && (
        <div className="max-w-md mx-auto">
          {profilesLoading ? (
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8">
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-2 border-violet-400 border-t-transparent mx-auto mb-4"></div>
                <p className="text-white/60 text-lg mb-2">Finding your perfect matches...</p>
                <p className="text-white/40 text-sm">Using our advanced compatibility algorithm</p>
              </div>
            </div>
          ) : error ? (
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">😕</div>
                <h3 className="text-xl font-bold text-white mb-2">Oops!</h3>
                <p className="text-white/70 mb-6">{error}</p>
                <button
                  onClick={() => {
                    setError('');
                    fetchProfiles();
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-xl hover:from-violet-600 hover:to-pink-600 transition-all duration-200 font-semibold shadow-lg shadow-violet-500/25"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : !currentProfile ? (
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-white mb-2">No more profiles!</h3>
                <p className="text-white/70 mb-6">You've seen all available matches. Check back later for new profiles!</p>
                <button
                  onClick={() => {
                    setCurrentProfileIndex(0);
                    fetchProfiles();
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-xl hover:from-violet-600 hover:to-pink-600 transition-all duration-200 font-semibold shadow-lg shadow-violet-500/25"
                >
                  Refresh Profiles
                </button>
              </div>
            </div>
          ) : (
            // Profile Card
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              {/* Profile Images Carousel */}
              <div className="relative h-96">
                <img
                  src={currentProfile.photos[0]}
                  alt={currentProfile.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Online Status */}
                {currentProfile.isOnline && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                    Online
                  </div>
                )}

                {/* Verification Badge */}
                {currentProfile.isVerified && (
                  <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                    <Star className="w-3 h-3 mr-1" />
                    Verified
                  </div>
                )}

                {/* Compatibility Score */}
                <div className="absolute bottom-4 right-4 bg-gradient-to-r from-violet-500 to-pink-500 text-white px-3 py-2 rounded-full text-sm font-bold">
                  {currentProfile.compatibility}% Match
                </div>

                {/* Profile Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold text-white">
                      {currentProfile.name}, {currentProfile.age}
                    </h2>
                    <div className="flex items-center text-white/80">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="text-sm">{currentProfile.distance}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-white/80 text-sm mb-3">
                    <div className="flex items-center">
                      <GraduationCap className="w-4 h-4 mr-1" />
                      {currentProfile.college}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Year {currentProfile.year}
                    </div>
                  </div>

                  {currentProfile.mutualFriends > 0 && (
                    <div className="text-white/70 text-xs mb-2">
                      {currentProfile.mutualFriends} mutual friends
                    </div>
                  )}

                  <p className="text-white/90 text-sm mb-3 line-clamp-2">{currentProfile.bio}</p>

                  <div className="flex flex-wrap gap-2">
                    {currentProfile.interests.slice(0, 3).map((interest, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 backdrop-blur-md bg-white/20 border border-white/30 rounded-full text-white text-xs"
                      >
                        {interest}
                      </span>
                    ))}
                    {currentProfile.interests.length > 3 && (
                      <span className="px-2 py-1 backdrop-blur-md bg-white/20 border border-white/30 rounded-full text-white text-xs">
                        +{currentProfile.interests.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6">
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handlePass}
                    className="w-14 h-14 backdrop-blur-md bg-white/10 border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 transition-all hover:scale-110 active:scale-95 group"
                  >
                    <X className="w-6 h-6 text-white/70 group-hover:text-red-400 transition-colors" />
                  </button>

                  <button
                    onClick={handleSuperLike}
                    className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center hover:shadow-lg hover:shadow-blue-500/25 transition-all hover:scale-110 active:scale-95"
                  >
                    <Zap className="w-6 h-6 text-white" />
                  </button>

                  <button
                    onClick={handleLike}
                    className="w-14 h-14 bg-gradient-to-r from-violet-500 to-pink-500 rounded-full flex items-center justify-center hover:shadow-lg hover:shadow-violet-500/25 transition-all hover:scale-110 active:scale-95"
                  >
                    <Heart className="w-6 h-6 text-white" />
                  </button>

                  <button className="w-14 h-14 backdrop-blur-md bg-white/10 border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 transition-all hover:scale-110 active:scale-95 group">
                    <MessageCircle className="w-6 h-6 text-white/70 group-hover:text-blue-400 transition-colors" />
                  </button>
                </div>

                <div className="text-center mt-4">
                  <p className="text-white/60 text-sm">
                    {profiles.length - currentProfileIndex - 1} more profiles to discover
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-violet-500 border-t-transparent mx-auto"></div>
              <p className="text-white/60 mt-4">Loading posts...</p>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <div key={post.id} className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  {/* Post Header */}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={post.userAvatar}
                          alt={post.userName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-violet-400"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-white">{post.userName}</h3>
                            <span className="text-white/60 text-sm">• {post.userAge}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-white/60 text-xs">
                            <GraduationCap className="w-3 h-3" />
                            <span>{post.userCollege}</span>
                            <span>•</span>
                            <MapPin className="w-3 h-3" />
                            <span>{post.userLocation}</span>
                            <span>•</span>
                            <Clock className="w-3 h-3" />
                            <span>{post.timestamp}</span>
                          </div>
                        </div>
                      </div>
                        <div className="relative">
                        <button 
                          onClick={() => setActiveDropdown(activeDropdown === post.id ? null : post.id)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-white/60" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeDropdown === post.id && (
                          <div className="absolute right-0 top-12 backdrop-blur-md bg-white/10 border border-white/20 rounded-lg shadow-lg z-50 min-w-[150px]">
                          <button 
                            onClick={() => {
                              setEditingPost({id: post.id, content: post.content});
                              setActiveDropdown(null);
                            }} 
                            className="w-full px-4 py-2 text-left text-white/80 hover:bg-white/10 hover:text-white transition-colors rounded-t-lg flex items-center space-x-2"
                          >
                            <span>Edit Post</span>
                          </button>
                          <button 
                            onClick={() => {
                            if (navigator.share) {
                              navigator.share({
                              title: post.userName + "'s post",
                              text: post.content,
                              url: window.location.origin + `/posts/${post.id}`,
                              }).catch(() => {});
                            } else {
                              navigator.clipboard.writeText(window.location.origin + `/posts/${post.id}`);
                              alert('Post link copied to clipboard!');
                            }
                            setActiveDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left text-white/80 hover:bg-white/10 hover:text-white transition-colors flex items-center space-x-2"
                          >
                            <Share2 className="w-4 h-4" />
                            <span>Share Post</span>
                          </button>
                          <button 
                            onClick={() => {
                              handleDeletePost(post.id);
                              setActiveDropdown(null);
                            }} 
                            className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors rounded-b-lg flex items-center space-x-2"
                          >
                            <X className="w-4 h-4" />
                            <span>Delete Post</span>
                          </button>
                          </div>
                        )}
                        </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="px-4 pb-3">
                    {editingPost && editingPost.id === post.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={editingPost.content}
                          onChange={(e) => setEditingPost({...editingPost, content: e.target.value})}
                          className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                          rows={4}
                        />
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditPost(editingPost.id, editingPost.content)}
                            className="px-4 py-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-lg hover:from-violet-600 hover:to-pink-600 transition-all font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingPost(null)}
                            className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-all font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-white/90 leading-relaxed">{post.content}</p>
                    )}
                  </div>

                  {/* Post Image */}
                  {post.image && (
                    <div className="relative">
                      <img
                        src={post.image.startsWith('http') ? post.image : `${BACKEND_URL}${post.image}`}
                        alt="Post"
                        className="w-full h-64 object-cover"
                        onError={(e) => {
                          console.log('Image failed to load:', post.image);
                          e.currentTarget.style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', post.image);
                        }}
                      />
                    </div>
                  )}

                  {/* Post Actions */}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => handlePostLike(post.id)}
                          className={`flex items-center space-x-2 transition-colors ${
                            post.isLiked ? 'text-red-400' : 'text-white/60 hover:text-red-400'
                          }`}
                        >
                          <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                          <span className="text-sm">{!isNaN(Number(post.likes)) ? post.likes : 0}</span>
                        </button>

                        <button
                          onClick={() => toggleComments(post.id)}
                          className="flex items-center space-x-2 text-white/60 hover:text-blue-400 transition-colors"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span className="text-sm">{post.comments}</span>
                        </button>

                        <button
                          className="text-white/60 hover:text-green-400 transition-colors"
                          onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                            title: post.userName + "'s post",
                            text: post.content,
                            url: window.location.origin + `/posts/${post.id}`,
                            }).catch(() => {});
                          } else {
                            // fallback: copy link to clipboard
                            navigator.clipboard.writeText(window.location.origin + `/posts/${post.id}`);
                            alert('Post link copied to clipboard!');
                          }
                          }}
                        >
                          <Share2 className="w-5 h-5" />
                        </button>
                      </div>

                      <button
                        onClick={() => handlePostBookmark(post.id)}
                        className={`transition-colors ${
                          post.isBookmarked ? 'text-yellow-400' : 'text-white/60 hover:text-yellow-400'
                        }`}
                      >
                        <Bookmark className={`w-5 h-5 ${post.isBookmarked ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Comment Section */}
                  {visibleComments === post.id && <CommentSection postId={post.id} />}
                </div>
              ))}

              {posts.length === 0 && !loading && (
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <p className="text-white/60">No posts yet. Be the first to share something!</p>
                  <button
                    onClick={() => setShowPostCreation(true)}
                    className="mt-4 px-6 py-3 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-xl hover:from-violet-600 hover:to-pink-600 transition-all duration-200 font-semibold shadow-lg shadow-violet-500/25"
                  >
                    Create Your First Post
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Post Creation Modal */}
      <PostCreation
        isOpen={showPostCreation}
        onClose={() => setShowPostCreation(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
}