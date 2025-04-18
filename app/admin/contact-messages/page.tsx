'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

export default function ContactMessagesPage() {
  const { t, dir } = useLanguage();
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedMessage, setExpandedMessage] = useState<number | null>(null);
  const [isReplying, setIsReplying] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('contact_messages')
        .select(`
          *,
          countries (
            name
          ),
          replies:contact_messages!parent_message_id(*)
        `)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Filter out replies from the main list
      const mainMessages = messagesData?.filter(msg => !msg.parent_message_id) || [];
      setMessages(mainMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError(t('contact.messages.error'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'PPp');
  };

  const renderReplies = (replies: any[]) => {
    if (!replies || replies.length === 0) return null;

    return (
      <div className="ml-6 mt-4 space-y-4">
        {replies.map((reply) => (
          <div key={reply.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-qatar-maroon">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{reply.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{reply.email}</p>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(reply.created_at)}
              </span>
            </div>
            <div className="prose max-w-none text-sm text-gray-700 dark:text-gray-300">
              {formatMessageContent(reply.message)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const markAsRead = async (id: number) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status: 'read' })
        .eq('id', id);

      if (error) throw error;
      fetchMessages();
      toast.success(t('contact.messages.markedAsRead'));
    } catch (error) {
      console.error('Error marking message as read:', error);
      toast.error(t('contact.messages.error'));
    }
  };

  const deleteMessage = async (id: number) => {
    if (!confirm(t('contact.messages.confirmDelete'))) return;

    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchMessages();
      toast.success(t('contact.messages.deleted'));
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error(t('contact.messages.error'));
    }
  };

  const getMessagePreview = (message: string) => {
    const words = message.split(' ');
    if (words.length <= 15) return message;
    return words.slice(0, 15).join(' ') + '...';
  };

  const formatMessageContent = (message: string) => {
    return (
      <>
        {message
          .split('\n')
          .map((line, index) => (
            <p key={index} className="mb-1 whitespace-pre-wrap">
              {line}
            </p>
          ))}
      </>
    );
  };

  const sendReply = async (messageId: number) => {
    if (!replyText.trim()) {
      toast.error(t('contact.messages.reply.error'));
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('contact_messages')
        .insert({
          name: user.user_metadata?.full_name || user.email,
          email: user.email,
          message: replyText,
          user_id: user.id,
          status: 'read',
          parent_message_id: messageId
        });

      if (error) throw error;

      toast.success(t('contact.messages.reply.success'));
      setIsReplying(null);
      setReplyText('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error(t('contact.messages.reply.error'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          {t('contact.messages.title')}
        </h1>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-4">
            <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-qatar-maroon"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('contact.messages.columns.name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('contact.messages.columns.email')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('contact.messages.columns.country')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('contact.messages.columns.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('contact.messages.columns.date')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('contact.messages.columns.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {messages.map((message) => (
                  <>
                    <tr key={message.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {message.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {message.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {message.countries?.name || t('contact.messages.unknownCountry')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          message.status === 'unread' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {t(`contact.messages.status.${message.status}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatDate(message.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => markAsRead(message.id)}
                          className="text-qatar-maroon hover:text-qatar-maroon-dark mr-2"
                          disabled={message.status === 'read'}
                        >
                          {t('contact.messages.actions.markAsRead')}
                        </button>
                        <button
                          onClick={() => deleteMessage(message.id)}
                          className="text-red-600 hover:text-red-900 mr-2"
                        >
                          {t('contact.messages.actions.delete')}
                        </button>
                        <button
                          onClick={() => setExpandedMessage(message.id)}
                          className="text-qatar-maroon hover:text-qatar-maroon-dark"
                        >
                          {expandedMessage === message.id ? 
                            t('contact.messages.actions.colapse') : 
                            t('contact.messages.actions.expand')
                          }
                        </button>
                      </td>
                    </tr>
                    {expandedMessage === message.id && (
                      <tr className="bg-gray-50 dark:bg-gray-800 transition-colors">
                        <td colSpan={6} className="p-6">
                          <div className="space-y-4">
                            <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {t('contact.messages.reply.title', { name: message.name })}
                                </h3>
                                <button
                                  onClick={() => setExpandedMessage(null)}
                                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                >
                                  {t('contact.messages.actions.colapse')}
                                </button>
                              </div>
                              <div className="prose max-w-none text-gray-700 dark:text-gray-300">
                                {formatMessageContent(message.message)}
                              </div>
                              <div className="mt-4 border-t dark:border-gray-600 pt-4">
                                <h4 className="text-sm font-medium mb-2 text-gray-900 dark:text-white">
                                  {t('contact.messages.replies')}
                                </h4>
                                {message.replies && message.replies.length > 0 ? (
                                  renderReplies(message.replies)
                                ) : (
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {t('contact.messages.noReplies')}
                                  </p>
                                )}
                              </div>
                            </div>
                            {isReplying === message.id ? (
                              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                                <h4 className="text-sm font-medium mb-2 text-gray-900 dark:text-white">
                                  {t('contact.messages.reply.title', { name: message.name })}
                                </h4>
                                <textarea
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                                  placeholder={t('contact.messages.reply.placeholder')}
                                  rows={4}
                                />
                                <div className="mt-2 flex justify-end space-x-2">
                                  <button
                                    onClick={() => sendReply(message.id)}
                                    className="bg-qatar-maroon text-white px-4 py-2 rounded-md hover:bg-qatar-maroon-dark"
                                  >
                                    {t('contact.messages.reply.send')}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setIsReplying(null);
                                      setReplyText('');
                                    }}
                                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                                  >
                                    {t('cancel')}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setIsReplying(message.id)}
                                className="text-qatar-maroon hover:text-qatar-maroon-dark"
                              >
                                {t('contact.messages.actions.reply')}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  </div>  
  );
}