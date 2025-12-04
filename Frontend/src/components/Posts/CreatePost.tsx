import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, MapPin, Users, Globe, Lock, Image, Video, Smile, AtSign, Hash, Send, Grid, List, Heart, MessageCircle, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import OptimizedAvatar from '@/components/ui/OptimizedAvatar';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URI || 'http://localhost:8000';

interface CreatePostProps {
  onPostCreated: (post: any) => void;
  user: any;
}

interface UserPost {
  id: string;
  title: string;
  content: string;
  image: string | null;
  postType: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export default function CreatePost({ onPostCreated, user }: CreatePostProps) {
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [previousPosts, setPreviousPosts] = useState<UserPost[]>([]);
  const [loadingPreviousPosts, setLoadingPreviousPosts] = useState(false);
  const [showPreviousPosts, setShowPreviousPosts] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showComments, setShowComments] = useState<string | null>(null);
  const [comments, setComments] = useState<{[key: string]: any[]}>({});
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<{id: string, content: string, title: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user's previous posts
  const fetchPreviousPosts = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingPreviousPosts(true);
      const response = await fetch(`${BACKEND_URL}/user-posts/my-posts?limit=6`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setPreviousPosts(data.userPosts || []);
      }
    } catch (error) {
      console.error('Failed to fetch previous posts:', error);
    } finally {
      setLoadingPreviousPosts(false);
    }
  };

  useEffect(() => {
    fetchPreviousPosts();
  }, [user?.id]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      alert('You can upload maximum 5 images');
      return;
    }

    setImages([...images, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (images.length === 0) {
      alert('Please select at least one image to upload to your profile gallery');
      return;
    }

    setIsPosting(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add post data
      formData.append('title', caption || 'Profile Image');
      formData.append('content', caption || '');
      formData.append('postType', 'image');
      
      // Add the first image
      formData.append('image', images[0]);

      const response = await fetch(`${BACKEND_URL}/user-posts/create`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const result = await response.json();
      console.log('Image uploaded successfully:', result);

      onPostCreated(result.userPost);

      // Refresh previous posts to show the new one
      await fetchPreviousPosts();

      // Reset form
      setCaption('');
      setImages([]);
      setImagePreviews([]);

    } catch (error) {
      console.error('Failed to upload image:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload image. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    const post = previousPosts.find(p => p.id === postId);
    if (!post) return;

    const isCurrentlyLiked = post.post?.isLiked;
    const currentLikeCount = post.post?.likesCount || 0;

    // Optimistic UI update
    setPreviousPosts(prev => prev.map(p =>
      p.id === postId
        ? {
            ...p,
            post: {
              ...p.post,
              isLiked: !isCurrentlyLiked,
              likesCount: isCurrentlyLiked ? currentLikeCount - 1 : currentLikeCount + 1
            }
          }
        : p
    ));

    try {
      const endpoint = isCurrentlyLiked ? 'unlike' : 'like';
      const response = await fetch(`${BACKEND_URL}/user-posts/${postId}/${endpoint}`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        // Rollback on error
        setPreviousPosts(prev => prev.map(p =>
          p.id === postId
            ? {
                ...p,
                post: {
                  ...p.post,
                  isLiked: isCurrentlyLiked,
                  likesCount: currentLikeCount
                }
              }
            : p
        ));
        throw new Error('Failed to update like');
      }
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const handleToggleComments = async (postId: string) => {
    if (showComments === postId) {
      setShowComments(null);
      return;
    }

    setShowComments(postId);
    
    if (!comments[postId]) {
      setLoadingComments(postId);
      try {
        const response = await fetch(`${BACKEND_URL}/user-posts/${postId}/comments`, {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setComments(prev => ({
            ...prev,
            [postId]: data.comments || []
          }));
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setLoadingComments(null);
      }
    }
  };

  const handleAddComment = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`${BACKEND_URL}/user-posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: newComment })
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), data.comment]
        }));
        
        // Update comment count
        setPreviousPosts(prev => prev.map(p =>
          p.id === postId
            ? {
                ...p,
                post: {
                  ...p.post,
                  commentsCount: (p.post?.commentsCount || 0) + 1
                }
              }
            : p
        ));

        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleEditPost = async (postId: string, newContent: string, newTitle: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/user-posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          content: newContent,
          title: newTitle 
        })
      });

      if (response.ok) {
        // Update the post in the local state
        setPreviousPosts(previousPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                content: newContent,
                title: newTitle
              }
            : post
        ));
        setEditingPost(null);
        setActiveDropdown(null);
      } else {
        alert('Failed to update post');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/user-posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        // Remove the post from local state
        setPreviousPosts(previousPosts.filter(post => post.id !== postId));
        setActiveDropdown(null);
      } else {
        alert('Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown && !(event.target as Element).closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const extractContent = (content: string) => {
    return content
      .replace(/📍\s*.+/g, '')
      .replace(/🏷️\s*.+/g, '')
      .trim();
  };

  return (
    <div className="space-y-8">
      {/* Create New Post Section */}
      

      {/* Previous Posts Section */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-white">Your Posts</h2>
            <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm">
              {previousPosts.length} posts
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPreviousPosts(!showPreviousPosts)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white/70 hover:bg-white/20 transition-all text-sm"
            >
              {showPreviousPosts ? 'Hide' : 'Show'} Posts
            </button>
            
            {showPreviousPosts && (
              <div className="flex bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-all ${
                    viewMode === 'list' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {showPreviousPosts && (
          <>
            {loadingPreviousPosts ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-white/60">Loading your posts...</p>
              </div>
            ) : previousPosts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                  <Image className="w-8 h-8 text-white/40" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No posts yet</h3>
                <p className="text-white/60 mb-4">Your shared posts will appear here to help you maintain a great profile!</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-4"
              }>
                {previousPosts.map((post) => (
                  <div
                    key={post.id}
                    className={`backdrop-blur-md bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:bg-white/10 transition-all duration-300 group ${
                      viewMode === 'list' ? 'p-4' : ''
                    }`}
                  >
                    {viewMode === 'grid' ? (
                      <>
                        {/* Grid View */}
                        {editingPost && editingPost.id === post.id ? (
                          // Edit Mode for Grid
                          <div className="p-3">
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={editingPost.title}
                                onChange={(e) => setEditingPost({...editingPost, title: e.target.value})}
                                placeholder="Post title..."
                                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                              />
                              <textarea
                                value={editingPost.content}
                                onChange={(e) => setEditingPost({...editingPost, content: e.target.value})}
                                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none text-sm"
                                rows={4}
                              />
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEditPost(editingPost.id, editingPost.content, editingPost.title)}
                                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-medium text-sm"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingPost(null)}
                                  className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-all font-medium text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Header with Options Menu */}
                            <div className="flex items-center justify-between p-3 pb-2">
                              <div className="flex items-center space-x-2">
                                <OptimizedAvatar
                                  src={user?.avatar}
                                  alt={user?.name || 'User'}
                                  fallbackText={user?.name?.charAt(0) || 'U'}
                                  size="sm"
                                />
                                <div>
                                  <h4 className="font-medium text-white text-sm">{user?.name || 'User'}</h4>
                                  <p className="text-white/60 text-xs">{formatTime(post.createdAt)}</p>
                                </div>
                              </div>
                              
                              {/* Options Menu */}
                              <div className="dropdown-container relative">
                                <button 
                                  onClick={() => setActiveDropdown(activeDropdown === post.id ? null : post.id)}
                                  className="p-1 hover:bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <MoreHorizontal className="w-4 h-4 text-white/60" />
                                </button>

                                {/* Dropdown Menu */}
                                {activeDropdown === post.id && (
                                  <div className="absolute right-0 top-8 backdrop-blur-md bg-white/10 border border-white/20 rounded-lg shadow-lg z-50 min-w-[150px]">
                                    <button 
                                      onClick={() => {
                                        setEditingPost({
                                          id: post.id, 
                                          content: post.content,
                                          title: post.title
                                        });
                                        setActiveDropdown(null);
                                      }} 
                                      className="w-full px-4 py-2 text-left text-white/80 hover:bg-white/10 hover:text-white transition-colors rounded-t-lg flex items-center space-x-2"
                                    >
                                      <Edit className="w-4 h-4" />
                                      <span>Edit Post</span>
                                    </button>
                                    <button 
                                      onClick={() => handleDeletePost(post.id)} 
                                      className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors rounded-b-lg flex items-center space-x-2"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      <span>Delete Post</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {post.image && (
                              <div className="aspect-square">
                                <img
                                  src={`${BACKEND_URL}${post.image}`}
                                  alt="Post"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="p-3">
                              <p className="text-white text-sm line-clamp-2 mb-2">
                                {extractContent(post.content)}
                              </p>
                              
                              {/* Like and Comment Actions for Grid */}
                              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                                <button
                                  onClick={() => handleLike(post.id)}
                                  className={`flex items-center space-x-1 transition-colors ${
                                    post.post?.isLiked 
                                      ? 'text-red-400' 
                                      : 'text-white/60 hover:text-red-400'
                                  }`}
                                >
                                  <Heart className={`w-4 h-4 ${post.post?.isLiked ? 'fill-current' : ''}`} />
                                  <span className="text-xs">{post.post?.likesCount || 0}</span>
                                </button>
                                <button
                                  onClick={() => handleToggleComments(post.id)}
                                  className="flex items-center space-x-1 text-white/60 hover:text-blue-400 transition-colors"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                  <span className="text-xs">{post.post?.commentsCount || 0}</span>
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        {/* List View */}
                        {editingPost && editingPost.id === post.id ? (
                          // Edit Mode for List
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editingPost.title}
                              onChange={(e) => setEditingPost({...editingPost, title: e.target.value})}
                              placeholder="Post title..."
                              className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                            />
                            <textarea
                              value={editingPost.content}
                              onChange={(e) => setEditingPost({...editingPost, content: e.target.value})}
                              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none text-sm"
                              rows={4}
                            />
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditPost(editingPost.id, editingPost.content, editingPost.title)}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-medium text-sm"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingPost(null)}
                                className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-all font-medium text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Header with Options Menu */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <OptimizedAvatar
                                  src={user?.avatar}
                                  alt={user?.name || 'User'}
                                  fallbackText={user?.name?.charAt(0) || 'U'}
                                  size="sm"
                                />
                                <div>
                                  <h4 className="font-medium text-white text-sm">{user?.name || 'User'}</h4>
                                  <p className="text-white/60 text-xs">{formatTime(post.createdAt)}</p>
                                </div>
                              </div>
                              
                              {/* Options Menu */}
                              <div className="dropdown-container relative">
                                <button 
                                  onClick={() => setActiveDropdown(activeDropdown === post.id ? null : post.id)}
                                  className="p-1 hover:bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <MoreHorizontal className="w-4 h-4 text-white/60" />
                                </button>

                                {/* Dropdown Menu */}
                                {activeDropdown === post.id && (
                                  <div className="absolute right-0 top-8 backdrop-blur-md bg-white/10 border border-white/20 rounded-lg shadow-lg z-50 min-w-[150px]">
                                    <button 
                                      onClick={() => {
                                        setEditingPost({
                                          id: post.id, 
                                          content: post.content,
                                          title: post.title
                                        });
                                        setActiveDropdown(null);
                                      }} 
                                      className="w-full px-4 py-2 text-left text-white/80 hover:bg-white/10 hover:text-white transition-colors rounded-t-lg flex items-center space-x-2"
                                    >
                                      <Edit className="w-4 h-4" />
                                      <span>Edit Post</span>
                                    </button>
                                    <button 
                                      onClick={() => handleDeletePost(post.id)} 
                                      className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors rounded-b-lg flex items-center space-x-2"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      <span>Delete Post</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex space-x-4">
                              {post.image && (
                                <div className="w-16 h-16 flex-shrink-0">
                                  <img
                                    src={`${BACKEND_URL}${post.image}`}
                                    alt="Post"
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="text-white text-sm mb-1 line-clamp-2">
                                  {extractContent(post.content)}
                                </p>
                                
                                {/* Like and Comment Actions for List */}
                                <div className="flex items-center space-x-4 mt-2">
                                  <button
                                    onClick={() => handleLike(post.id)}
                                    className={`flex items-center space-x-1 transition-colors ${
                                      post.post?.isLiked 
                                        ? 'text-red-400' 
                                        : 'text-white/60 hover:text-red-400'
                                    }`}
                                  >
                                    <Heart className={`w-4 h-4 ${post.post?.isLiked ? 'fill-current' : ''}`} />
                                    <span className="text-xs">{post.post?.likesCount || 0}</span>
                                  </button>
                                  <button
                                    onClick={() => handleToggleComments(post.id)}
                                    className="flex items-center space-x-1 text-white/60 hover:text-blue-400 transition-colors"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                    <span className="text-xs">{post.post?.commentsCount || 0}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    )}
                    
                    {/* Comments Section */}
                    {showComments === post.id && (
                      <div className="p-3 border-t border-white/10 mt-2">
                        {loadingComments === post.id ? (
                          <div className="flex items-center space-x-2 text-white/60 text-sm">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white/60"></div>
                            <span>Loading comments...</span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Existing Comments */}
                            {comments[post.id]?.length > 0 && (
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {comments[post.id].map((comment: any, index: number) => (
                                  <div key={index} className="flex items-start space-x-2">
                                    <img
                                      src={comment.author?.avatar || `https://api.dicebear.com/8.x/lorelei/svg?seed=${comment.author?.name}`}
                                      alt={comment.author?.name}
                                      className="w-6 h-6 rounded-full flex-shrink-0"
                                    />
                                    <div className="bg-white/5 rounded-lg px-3 py-2 flex-1">
                                      <p className="text-white/90 font-medium text-xs">{comment.author?.name}</p>
                                      <p className="text-white/70 text-sm">{comment.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Add Comment Form */}
                            <form onSubmit={(e) => handleAddComment(post.id, e)} className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                              />
                              <button
                                type="submit"
                                disabled={!newComment.trim()}
                                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm flex items-center space-x-1"
                              >
                                <Send className="w-3 h-3" />
                                <span>Post</span>
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {previousPosts.length > 0 && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => window.open('/profile', '_blank')}
                  className="px-6 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all text-sm"
                >
                  View All Posts
                </button>
              </div>
            )}
          </>
        )}
      </div>



      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 max-w-2xl mx-auto">
        <div className="flex items-center space-x-3 mb-4">
          <OptimizedAvatar 
            src={user?.avatar} 
            alt="User" 
            fallbackText={user?.name || user?.email?.split('@')[0] || "U"}
            size="md"
            className="cursor-pointer"
            lazy={false}
          />
          <div>
            <h3 className="font-semibold text-white">{user?.name || 'User'}</h3>
            <p className="text-white/60 text-xs">{user?.college || 'College'}</p>
          </div>
        </div>

        {/* Content Input */}
        <div className="relative mb-4">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full h-32 p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            placeholder="Add a caption to your image (optional)..."
            maxLength={1000}
          />
          <div className="absolute bottom-2 right-2 text-white/40 text-xs">
            {caption.length}/1000
          </div>
        </div>

        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Post Options */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-all text-white/70"
            >
              <Camera className="w-4 h-4" />
              <span className="text-sm">Photo</span>
            </button>
          </div>
        </div>

        {/* Post Button */}
        <button
          onClick={handlePost}
          disabled={isPosting || images.length === 0}
          className="w-full py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center space-x-2"
        >
          {isPosting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Uploading Image...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Upload to Profile</span>
            </>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>



    </div>
  );
}