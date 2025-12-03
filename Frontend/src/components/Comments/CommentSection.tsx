const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';

interface CommentUser {
  name: string;
  profile?: { avatar?: string; };
}

interface Comment {
  id: string;
  content: string;
  author: CommentUser;
}

interface CommentSectionProps {
  postId: string;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/posts/${postId}/comments`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setComments(data.comments);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [postId]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const response = await fetch(`${BACKEND_URL}/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ content: newComment }),
    });

    if (response.ok) {
      const data = await response.json();
      setComments([...comments, data.comment]);
      setNewComment('');
    }
  };

  return (
    <div className="p-4 pt-2 border-t border-white/10">
      <form onSubmit={handleCommentSubmit} className="flex items-center space-x-2 mb-4">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-violet-500"
        />
        <button type="submit" disabled={!newComment.trim()} className="p-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50">
          <Send className="w-5 h-5" />
        </button>
      </form>

      <div className="space-y-3 max-h-60 overflow-y-auto">
        {loading ? (
          <p className="text-white/50">Loading comments...</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex items-start space-x-3">
              <img
                src={comment.author.profile?.avatar || `https://api.dicebear.com/8.x/lorelei/svg?seed=${comment.author.name}`}
                alt={comment.author.name}
                className="w-8 h-8 rounded-full"
              />
              <div className="bg-white/5 p-3 rounded-lg flex-1">
                <p className="font-semibold text-white text-sm">{comment.author.name}</p>
                <p className="text-white/80 text-sm">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}