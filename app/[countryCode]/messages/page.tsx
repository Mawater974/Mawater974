'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMessaging } from '@/contexts/MessagingContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Loader2, Send, MessageSquare, User } from 'lucide-react';

export default function MessagesPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const {
    conversations,
    currentConversation,
    messages,
    loading,
    error,
    sendMessage,
    selectConversation,
    createNewConversation,
    unreadCounts,
    markAsRead,
  } = useMessaging();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (conversations.length > 0 && !currentConversation) {
      selectConversation(conversations[0]);
    }
  }, [conversations, currentConversation, selectConversation]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-64px)]">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full">
        {/* Conversations list */}
        <Card className="md:col-span-1 h-full overflow-hidden">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
          </CardHeader>
          <ScrollArea className="h-[calc(100%-80px)]">
            <div className="space-y-2 p-2">
              {conversations.map((conversation) => {
                const otherUser = conversation.participants?.find(p => p.id !== user?.id);
                const unreadCount = unreadCounts[conversation.id] || 0;
                
                return (
                  <div
                    key={conversation.id}
                    className={`p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                      currentConversation?.id === conversation.id ? 'bg-gray-100 dark:bg-gray-800' : ''
                    }`}
                    onClick={() => selectConversation(conversation)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={otherUser?.avatar_url || ''} alt={otherUser?.full_name} />
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {otherUser?.full_name || 'Unknown User'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                            {conversation.last_message?.content || 'No messages yet'}
                          </p>
                        </div>
                      </div>
                      {unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {conversations.length === 0 && !loading && (
                <div className="text-center p-4 text-gray-500">
                  No conversations yet. Start a new one!
                </div>
              )}
              
              {loading && conversations.length === 0 && (
                <div className="flex justify-center p-4">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t">
            <Button className="w-full" onClick={() => router.push('/messages/new')}>
              <MessageSquare className="mr-2 h-4 w-4" />
              New Message
            </Button>
          </div>
        </Card>

        {/* Chat area */}
        <Card className="md:col-span-3 h-full flex flex-col">
          {currentConversation ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage 
                      src={currentConversation.participants?.find(p => p.id !== user?.id)?.avatar_url || ''} 
                      alt={currentConversation.participants?.find(p => p.id !== user?.id)?.full_name} 
                    />
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {currentConversation.participants?.find(p => p.id !== user?.id)?.full_name || 'Unknown User'}
                    </CardTitle>
                    <CardDescription>
                      {currentConversation.participants?.find(p => p.id !== user?.id)?.email || ''}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] p-3 rounded-lg ${
                              message.sender_id === user?.id
                                ? 'bg-blue-500 text-white rounded-br-none'
                                : 'bg-gray-100 dark:bg-gray-800 rounded-bl-none'
                            }`}
                          >
                            <p>{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {format(new Date(message.created_at), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
              
              <div className="p-4 border-t">
                <MessageInput 
                  onSend={(content) => sendMessage(content)} 
                  disabled={loading}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No conversation selected</h3>
              <p className="text-gray-500 mb-4">
                Select a conversation or start a new one to begin messaging.
              </p>
              <Button onClick={() => router.push('/messages/new')}>
                <MessageSquare className="mr-2 h-4 w-4" />
                New Message
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function MessageInput({ onSend, disabled }: { onSend: (content: string) => void; disabled: boolean }) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;
    
    setIsSending(true);
    try {
      await onSend(message);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex space-x-2">
      <Input
        type="text"
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={disabled || isSending}
        className="flex-1"
      />
      <Button type="submit" disabled={!message.trim() || isSending}>
        {isSending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
}
