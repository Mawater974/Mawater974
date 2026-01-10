
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getComments, createComment, deleteComment } from '../services/dataService';
import { Comment } from '../types';
import { MessageCircle, Send, Trash2, User } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Link, useParams } from 'react-router-dom';

interface CommentSectionProps {
  entityId: number | string;
  entityType: 'car' | 'part';
}

export const CommentSection: React.FC<CommentSectionProps> = ({ entityId, entityType }) => {
  const { user, profile } = useAuth();
  const { t } = useAppContext();
  const { countryCode } = useParams<{ countryCode: string }>();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadComments = async () => {
    const data = await getComments(entityId, entityType);
    setComments(data);
  };

  useEffect(() => {
    loadComments();
  }, [entityId, entityType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setSubmitting(true);
    const commentData: Partial<Comment> = {
      user_id: user.id,
      content: newComment,
    };

    if (entityType === 'car') commentData.car_id = Number(entityId);
    else commentData.spare_part_id = String(entityId);

    const created = await createComment(commentData);
    if (created) {
      setComments([...comments, created]);
      setNewComment('');
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: number) => {
    if (confirm(t('comments.delete_confirm'))) {
      await deleteComment(commentId);
      setComments(comments.filter(c => c.id !== commentId));
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mt-8">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2 dark:text-white">
        <MessageCircle className="w-5 h-5 text-primary-600" />
        {t('comments.title')} ({comments.length})
      </h3>

      {/* List */}
      <div className="space-y-6 mb-8">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-4">{t('comments.no_comments')}</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 overflow-hidden">
                {comment.profiles?.avatar_url ? (
                  <img src={comment.profiles.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div className="flex-grow">
                 <div className="flex justify-between items-start">
                    <div>
                        <span className="font-bold text-gray-900 dark:text-white mr-2">{comment.profiles?.full_name || t('common.user')}</span>
                        <span className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleDateString()}</span>
                    </div>
                    {(user?.id === comment.user_id || profile?.role === 'admin') && (
                        <button onClick={() => handleDelete(comment.id)} className="text-gray-400 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                 </div>
                 <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-4">
           <div className="flex-shrink-0 hidden md:flex w-10 h-10 rounded-full bg-primary-100 text-primary-600 items-center justify-center font-bold overflow-hidden">
              {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                  <User className="w-5 h-5" />
              )}
           </div>
           <div className="flex-grow relative">
              <input 
                type="text" 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t('comments.placeholder')}
                className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                disabled={submitting}
              />
              <button 
                type="submit" 
                disabled={!newComment.trim() || submitting}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary-600 hover:bg-primary-50 rounded-lg disabled:opacity-50"
              >
                 <Send className="w-5 h-5" />
              </button>
           </div>
        </form>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('comments.login_prompt')}</p>
            <Link to={`/${countryCode}/login`} className="text-primary-600 font-bold hover:underline">{t('comments.login_action')}</Link>
        </div>
      )}
    </div>
  );
};
