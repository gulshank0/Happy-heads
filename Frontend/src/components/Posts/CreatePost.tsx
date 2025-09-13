import React, { useState, useRef } from 'react';
import { Camera, X, MapPin, Users, Globe, Lock, Image, Video, Smile, AtSign, Hash, Send } from 'lucide-react';

interface CreatePostProps {
  onPostCreated: (post: any) => void;
  user: any;
}

export default function CreatePost({ onPostCreated, user }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [privacy, setPrivacy] = useState<'profile'>('profile');
  const [tags, setTags] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);

    // Extract hashtags
    const hashtagMatches = value.match(/#\w+/g);
    if (hashtagMatches) {
      const newTags = hashtagMatches.map(tag => tag.substring(1));
      setTags([...new Set(newTags)]);
    }
  };

  const addEmoji = (emoji: string) => {
    setContent(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handlePost = async () => {
    if (!content.trim() && images.length === 0) {
      alert('Please add some content or images');
      return;
    }

    setIsPosting(true);

    try {
      // Simulate API call
      const newPost = {
        id: Date.now().toString(),
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar || '',
        userAge: user.age,
        userCollege: user.college || 'College',
        userLocation: location || user.location || 'Location',
        content,
        images: imagePreviews,
        timestamp: 'Just now',
        likes: 0,
        comments: 0,
        isLiked: false,
        isBookmarked: false,
        tags,
        privacy
      };

      onPostCreated(newPost);

      // Reset form
      setContent('');
      setImages([]);
      setImagePreviews([]);
      setTags([]);
      setLocation('');
      setPrivacy('profile');

    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const emojis = ['😀', '😍', '🥰', '😘', '🤗', '🤔', '😎', '🙌', '💪', '👍', '❤️', '💕', '🎉', '🔥', '✨', '💯'];

  return (
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 max-w-2xl mx-auto">
      <div className="flex items-center space-x-3 mb-4">
        <img
          src={user?.avatar || 'https://via.placeholder.com/40'}
          alt="User"
          className="w-10 h-10 rounded-full object-cover border-2 border-violet-400"
        />
        <div>
          <h3 className="font-semibold text-white">{user?.name || 'User'}</h3>
          <p className="text-white/60 text-xs">{user?.college || 'College'}</p>
        </div>
      </div>

      {/* Content Input */}
      <div className="relative mb-4">
        <textarea
          value={content}
          onChange={handleContentChange}
          className="w-full h-32 p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
          placeholder="What's on your mind? Use #tags to categorize your post..."
          maxLength={1000}
        />
        <div className="absolute bottom-2 right-2 text-white/40 text-xs">
          {content.length}/1000
        </div>
      </div>

      {/* Hashtags Display */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="bg-violet-500/20 border border-violet-500/30 text-violet-300 px-3 py-1 rounded-full text-sm"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

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

      {/* Location Input */}
      <div className="mb-4">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-white/60" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Add location (optional)"
            className="flex-1 p-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="mb-4 p-3 bg-white/10 border border-white/20 rounded-lg">
          <div className="grid grid-cols-8 gap-2">
            {emojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => addEmoji(emoji)}
                className="text-2xl hover:bg-white/10 rounded p-1 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
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

          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="flex items-center space-x-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-all text-white/70"
          >
            <Smile className="w-4 h-4" />
            <span className="text-sm">Emoji</span>
          </button>

          <button className="flex items-center space-x-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-all text-white/70">
            <Hash className="w-4 h-4" />
            <span className="text-sm">Tag</span>
          </button>
        </div>
      </div>

      {/* Post Button */}
      <button
        onClick={handlePost}
        disabled={isPosting || (!content.trim() && images.length === 0)}
        className="w-full py-3 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-xl hover:from-violet-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center space-x-2"
      >
        {isPosting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span>Posting...</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            <span>Share Post</span>
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
  );
}