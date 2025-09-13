interface ImportMetaEnv {
  readonly BACKEND_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

const BACKEND_URL = import.meta.env.BACKEND_URL || 'http://localhost:8000';

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
  const [error, setError] = useState('');
  const [activeCommentSection, setActiveCommentSection] = useState<string | null>(null);
  const [visibleComments, setVisibleComments] = useState<string | null>(null);

  // Fetch real posts from API
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/posts/feed`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      } else {
        console.error('Failed to fetch posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch real profiles from API
  const fetchProfiles = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/posts/profiles`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setProfiles(data);
      } else {
        console.error('Failed to fetch profiles');
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchProfiles();
  }, []);

  const handlePostCreated = () => {
    fetchPosts(); // Refresh posts after creating a new one
  };

  const handleLike = () => {
    if (currentProfileIndex < profiles.length - 1) {
      setCurrentProfileIndex(currentProfileIndex + 1);
    } else {
      alert('No more profiles to discover!');
    }
  };

  const handlePass = () => {
    if (currentProfileIndex < profiles.length - 1) {
      setCurrentProfileIndex(currentProfileIndex + 1);
    } else {
      alert('No more profiles to discover!');
    }
  };

  const handleSuperLike = () => {
    alert('Super Like sent! ⚡');
    if (currentProfileIndex < profiles.length - 1) {
      setCurrentProfileIndex(currentProfileIndex + 1);
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
      {activeTab === 'discover' && currentProfile && (
        <div className="max-w-md mx-auto">
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
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4 text-white/60" />
                      </button>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="px-4 pb-3">
                    <p className="text-white/90 leading-relaxed">{post.content}</p>
                  </div>

                  {/* Post Image */}
                  {post.image && (
                    <div className="relative">
                      <img
                        src={post.image}
                        alt="Post"
                        className="w-full h-64 object-cover"
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