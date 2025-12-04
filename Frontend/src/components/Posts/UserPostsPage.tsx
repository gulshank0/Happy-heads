import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import CreatePost from './CreatePost';
import UserPostsGrid from './UserPostsGrid';

interface UserPostsPageProps {
  user: any;
  userId?: string; // If provided, shows posts for a specific user
}

export default function UserPostsPage({ user, userId }: UserPostsPageProps) {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePostCreated = (createdPost: any) => {
    console.log('New post created:', createdPost);
    
    // Immediately add the new post to the grid with animation
    setNewPost(createdPost);
    
    // Also trigger a refresh after a short delay to ensure sync with backend
    setTimeout(() => {
      setRefreshTrigger(prev => prev + 1);
      setNewPost(null); // Clear the new post after refresh
    }, 2000);
    
    // Close the create post modal
    setShowCreatePost(false);
  };

  const handleAddPostClick = () => {
    setShowCreatePost(true);
  };

  const isCurrentUser = !userId; // If no userId provided, it's the current user's page

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-600/20 to-blue-700/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-600/20 to-purple-600/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-poppins text-4xl md:text-5xl font-bold leading-tight mb-4">
              <span className="bg-blue-500 bg-clip-text text-transparent">
                {isCurrentUser ? 'Your Posts' : `${user?.name}'s Posts`}
              </span>
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              {isCurrentUser 
                ? 'Share your thoughts, moments, and experiences with the community'
                : `Discover what ${user?.name} has been sharing`
              }
            </p>
          </div>

          {/* Create Post Button - Only show for current user */}
          {isCurrentUser && (
            <div className="mb-8 flex justify-center">
              <button
                onClick={handleAddPostClick}
                className="group relative inline-flex items-center px-8 py-4 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-all duration-300 font-semibold shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105"
              >
                <div className="absolute inset-0 bg-blue-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <Plus className="w-5 h-5 mr-2 relative z-10" />
                <span className="relative z-10">Create New Post</span>
              </button>
            </div>
          )}

          {/* Success Message */}
          {newPost && (
            <div className="mb-6 animate-success-popup">
              <div className="max-w-md mx-auto backdrop-blur-md bg-green-500/20 border border-green-500/30 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center space-x-2 text-green-300">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="font-semibold">Post shared successfully!</span>
                </div>
                <p className="text-green-200/80 text-sm mt-1">Your new post is now live and visible to everyone</p>
              </div>
            </div>
          )}

          {/* Posts Grid */}
          <UserPostsGrid
            userId={userId}
            refreshTrigger={refreshTrigger}
            newPost={newPost}
            onAddPost={handleAddPostClick}
          />
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-2xl">
            {/* Close Button */}
            <button
              onClick={() => setShowCreatePost(false)}
              className="absolute -top-4 -right-4 z-10 w-10 h-10 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-full flex items-center justify-center text-red-300 hover:text-red-200 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Create Post Component */}
            <CreatePost
              user={user}
              onPostCreated={handlePostCreated}
            />
          </div>
        </div>
      )}
    </div>
  );
}