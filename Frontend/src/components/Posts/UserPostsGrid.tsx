import React, { useState, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Share,
  MoreHorizontal,
  MapPin,
  Plus,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import OptimizedAvatar from "@/components/ui/OptimizedAvatar";

import { BACKEND_URL } from "../../config/api";

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
  post: {
    id: string;
    title: string;
    content: string;
    image: string | null;
    createdAt: string;
  };
}

interface UserPostsGridProps {
  userId?: string; // If not provided, fetches current user's posts
  refreshTrigger?: number; // Used to trigger refresh when new post is created
  newPost?: any; // New post to add immediately
  onAddPost?: () => void; // Callback to add a new post
}

export default function UserPostsGrid({
  userId,
  refreshTrigger,
  newPost,
  onAddPost,
}: UserPostsGridProps) {
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [animatingPostId, setAnimatingPostId] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<{
    id: string;
    content: string;
    title: string;
  } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Fetch current user info
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/auth/me`, {
          credentials: "include",
        });
        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  const fetchPosts = async (pageNum = 1, reset = false) => {
    try {
      setLoading(true);

      const endpoint = userId
        ? `/user-posts/user/${userId}?page=${pageNum}&limit=12`
        : `/user-posts/my-posts?page=${pageNum}&limit=12`;

      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }

      const data = await response.json();

      if (reset || pageNum === 1) {
        setPosts(data.userPosts);
      } else {
        setPosts((prev) => [...prev, ...data.userPosts]);
      }

      setHasMore(data.pagination.page < data.pagination.pages);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  // Handle immediate post addition with animation
  useEffect(() => {
    if (newPost && newPost.backendData) {
      // Create a properly formatted UserPost from the new post
      const formattedNewPost: UserPost = {
        id: newPost.backendData.id,
        title: newPost.backendData.title,
        content: newPost.backendData.content,
        image: newPost.backendData.image,
        postType: newPost.backendData.postType,
        createdAt: newPost.backendData.createdAt || new Date().toISOString(),
        user: newPost.backendData.user,
        post: newPost.backendData.post,
      };

      // Add the new post to the beginning of the list
      setPosts((prev) => [formattedNewPost, ...prev]);

      // Trigger entrance animation
      setAnimatingPostId(formattedNewPost.id);
      setTimeout(() => setAnimatingPostId(null), 1000);
    }
  }, [newPost]);

  useEffect(() => {
    fetchPosts(1, true);
    setPage(1);
  }, [userId, refreshTrigger]);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage, false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const extractLocation = (content: string) => {
    const locationMatch = content.match(/📍\s*(.+?)(?=\n|$)/);
    return locationMatch ? locationMatch[1].trim() : null;
  };

  const extractTags = (content: string) => {
    const tagMatch = content.match(/🏷️\s*(.+?)(?=\n|$)/);
    if (tagMatch) {
      return tagMatch[1].split(" ").filter((tag) => tag.startsWith("#"));
    }
    return [];
  };

  const cleanContent = (content: string) => {
    return content
      .replace(/📍\s*.+/g, "")
      .replace(/🏷️\s*.+/g, "")
      .trim();
  };

  const handleEditPost = async (
    postId: string,
    newContent: string,
    newTitle: string,
  ) => {
    try {
      const response = await fetch(`${BACKEND_URL}/user-posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          content: newContent,
          title: newTitle,
        }),
      });

      if (response.ok) {
        // Update the post in the local state
        setPosts(
          posts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  content: newContent,
                  title: newTitle,
                  post: {
                    ...post.post,
                    content: newContent,
                    title: newTitle,
                  },
                }
              : post,
          ),
        );
        setEditingPost(null);
        setActiveDropdown(null);
      } else {
        alert("Failed to update post");
      }
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Failed to update post");
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this post? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/user-posts/${postId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        // Remove the post from local state
        setPosts(posts.filter((post) => post.id !== postId));
        setActiveDropdown(null);
      } else {
        alert("Failed to delete post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post");
    }
  };

  const isOwner = (post: UserPost) => {
    return !userId || (currentUser && post.user.id === currentUser.id);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activeDropdown &&
        !(event.target as Element).closest(".dropdown-container")
      ) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeDropdown]);

  if (loading && posts.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-white/10 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-white/10 rounded w-24 mb-2"></div>
                <div className="h-3 bg-white/10 rounded w-16"></div>
              </div>
            </div>
            <div className="h-40 bg-white/10 rounded-lg mb-3"></div>
            <div className="h-4 bg-white/10 rounded w-full mb-2"></div>
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => fetchPosts(1, true)}
          className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-white/60 mb-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
            <MessageCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            No posts yet
          </h3>
          <p className="text-white/60">
            {userId
              ? "This user hasn't shared anything yet."
              : "Share your first post to get started!"}
          </p>
          {!userId && onAddPost && (
            <button
              onClick={onAddPost}
              className="mt-4 inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 font-semibold shadow-lg shadow-blue-500/25"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Post
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((userPost, index) => {
          const location = extractLocation(userPost.content);
          const tags = extractTags(userPost.content);
          const cleanedContent = cleanContent(userPost.content);
          const imageUrl = userPost.image
            ? `${BACKEND_URL}${userPost.image}`
            : null;
          const isAnimating = animatingPostId === userPost.id;
          const showOptions = isOwner(userPost);

          return (
            <div
              key={userPost.id}
              className={`backdrop-blur-md bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all duration-300 group ${
                isAnimating
                  ? "animate-slide-in-from-top scale-105 shadow-2xl shadow-violet-500/20"
                  : index === 0 && animatingPostId === null
                    ? "animate-fade-in"
                    : ""
              }`}
              style={{
                animationDelay: isAnimating ? "0ms" : `${index * 100}ms`,
              }}
            >
              {/* New Post Badge */}
              {isAnimating && (
                <div className="absolute top-2 right-2 z-10 bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-lg animate-pulse">
                  New!
                </div>
              )}

              {/* Header */}
              <div className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <OptimizedAvatar
                      src={userPost.user.avatar}
                      alt={userPost.user.name}
                      fallbackText={userPost.user.name?.charAt(0) || "U"}
                      size="sm"
                    />
                    <div>
                      <h4 className="font-medium text-white text-sm">
                        {userPost.user.name}
                      </h4>
                      <p className="text-white/60 text-xs">
                        {formatTime(userPost.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Options Menu - Only show for post owner */}
                  {showOptions && (
                    <div className="dropdown-container relative">
                      <button
                        onClick={() =>
                          setActiveDropdown(
                            activeDropdown === userPost.id ? null : userPost.id,
                          )
                        }
                        className="p-1 hover:bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <MoreHorizontal className="w-4 h-4 text-white/60" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeDropdown === userPost.id && (
                        <div className="absolute right-0 top-8 backdrop-blur-md bg-white/10 border border-white/20 rounded-lg shadow-lg z-50 min-w-[150px]">
                          <button
                            onClick={() => {
                              setEditingPost({
                                id: userPost.id,
                                content: userPost.content,
                                title: userPost.title,
                              });
                              setActiveDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left text-white/80 hover:bg-white/10 hover:text-white transition-colors rounded-t-lg flex items-center space-x-2"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Edit Post</span>
                          </button>
                          <button
                            onClick={() => handleDeletePost(userPost.id)}
                            className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors rounded-b-lg flex items-center space-x-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete Post</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Image */}
              {imageUrl && (
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={imageUrl}
                    alt="Post"
                    className={`w-full h-full object-cover transition-transform duration-300 ${
                      isAnimating ? "scale-105" : "group-hover:scale-105"
                    }`}
                  />
                  {isAnimating && (
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent animate-pulse"></div>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="p-4 pt-3">
                {editingPost && editingPost.id === userPost.id ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editingPost.title}
                      onChange={(e) =>
                        setEditingPost({
                          ...editingPost,
                          title: e.target.value,
                        })
                      }
                      placeholder="Post title..."
                      className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-violet-400 text-sm"
                    />
                    <textarea
                      value={editingPost.content}
                      onChange={(e) =>
                        setEditingPost({
                          ...editingPost,
                          content: e.target.value,
                        })
                      }
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none text-sm"
                      rows={4}
                    />
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          handleEditPost(
                            editingPost.id,
                            editingPost.content,
                            editingPost.title,
                          )
                        }
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
                  // Display Mode
                  <>
                    {cleanedContent && (
                      <p
                        className={`text-white text-sm mb-3 line-clamp-3 transition-all duration-300 ${
                          isAnimating ? "text-white animate-pulse" : ""
                        }`}
                      >
                        {cleanedContent}
                      </p>
                    )}

                    {/* Location */}
                    {location && (
                      <div className="flex items-center space-x-1 mb-2">
                        <MapPin className="w-3 h-3 text-white/60" />
                        <span className="text-xs text-white/60">
                          {location}
                        </span>
                      </div>
                    )}

                    {/* Tags */}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {tags.map((tag, index) => (
                          <span
                            key={index}
                            className={`text-xs bg-violet-500/20 text-violet-300 px-2 py-1 rounded-full transition-all duration-300 ${
                              isAnimating
                                ? "bg-violet-500/30 animate-pulse"
                                : ""
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <div className="flex items-center space-x-4">
                        <button className="flex items-center space-x-1 text-white/60 hover:text-red-400 transition-colors group">
                          <Heart className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span className="text-xs">0</span>
                        </button>
                        <button className="flex items-center space-x-1 text-white/60 hover:text-blue-400 transition-colors group">
                          <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span className="text-xs">0</span>
                        </button>
                      </div>
                      <button className="text-white/60 hover:text-white transition-colors group">
                        <Share className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all disabled:opacity-50 hover:scale-105"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Loading...</span>
              </div>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
