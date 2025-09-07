'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSupabase } from './SupabaseContext';
import { useAuth } from './AuthContext';

type Message = {
  id: string;
  content: string;
  sender_id: string;
  conversation_id: string;
  created_at: string;
  read: boolean;
};

type Participant = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
};

type Conversation = {
  id: string;
  created_at: string;
  last_message?: Message;
  participants: Participant[];
};

type MessagingContextType = {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  selectConversation: (conversation: Conversation) => void;
  createNewConversation: (participantId: string) => Promise<void>;
  unreadCounts: Record<string, number>;
  markAsRead: (conversationId: string) => void;
};

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const { supabase } = useSupabase();
  const { user } = useAuth();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // Fetch user's conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('conversations')
        .select(`
          id,
          created_at,
          last_message: messages!conversations_last_message_id_fkey (
            id,
            content,
            sender_id,
            created_at,
            read
          ),
          participants:conversation_participants!inner(
            user:profiles!conversation_participants_user_id_fkey(
              id,
              email,
              full_name,
              avatar_url
            )
          )
        `)
        .contains('participants.user.id', [user.id])
        .order('last_message.created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Transform the data to match our types
      const formattedConversations = data.map((conv: any) => ({
        id: conv.id,
        created_at: conv.created_at,
        last_message: conv.last_message,
        participants: conv.participants.map((p: any) => p.user)
      }));

      setConversations(formattedConversations);
      
      // Set the first conversation as active if none is selected
      if (formattedConversations.length > 0 && !currentConversation) {
        setCurrentConversation(formattedConversations[0]);
      }
      
      // Calculate unread counts
      const counts: Record<string, number> = {};
      formattedConversations.forEach((conv: Conversation) => {
        if (conv.last_message && !conv.last_message.read && conv.last_message.sender_id !== user.id) {
          counts[conv.id] = (counts[conv.id] || 0) + 1;
        }
      });
      setUnreadCounts(counts);
      
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user, supabase, currentConversation]);

  // Fetch messages for the current conversation
  const fetchMessages = useCallback(async () => {
    if (!currentConversation || !user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', currentConversation.id)
        .order('created_at', { ascending: true });
        
      if (fetchError) throw fetchError;
      
      setMessages(data || []);
      
      // Mark messages as read
      await markAsRead(currentConversation.id);
      
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [currentConversation, user, supabase]);

  // Mark messages as read
  const markAsRead = useCallback(async (conversationId: string) => {
    if (!user) return;
    
    try {
      // Update in the database
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id);
        
      if (error) throw error;
      
      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          msg.conversation_id === conversationId && !msg.read && msg.sender_id !== user.id
            ? { ...msg, read: true }
            : msg
        )
      );
      
      // Update unread counts
      setUnreadCounts(prev => ({
        ...prev,
        [conversationId]: 0
      }));
      
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }, [user, supabase]);

  // Send a message
  const sendMessage = useCallback(async (content: string) => {
    if (!currentConversation || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            content,
            sender_id: user.id,
            conversation_id: currentConversation.id,
            read: false
          }
        ])
        .select()
        .single();
        
      if (error) throw error;
      
      // Update the messages list
      setMessages(prev => [...prev, data]);
      
      // Update the last message in the conversation
      setConversations(prev => 
        prev.map(conv => 
          conv.id === currentConversation.id
            ? { ...conv, last_message: data }
            : conv
        )
      );
      
      // Mark as read
      await markAsRead(currentConversation.id);
      
      return data;
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      throw err;
    }
  }, [currentConversation, user, supabase, markAsRead]);

  // Select a conversation
  const selectConversation = useCallback((conversation: Conversation) => {
    setCurrentConversation(conversation);
  }, []);

  // Create a new conversation
  const createNewConversation = useCallback(async (participantId: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Check if a conversation already exists between these users
      const { data: existingConvo } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .in('user_id', [user.id, participantId])
        .group('conversation_id')
        .having('count(*)', 'gt', 1);
      
      if (existingConvo && existingConvo.length > 0) {
        // Conversation already exists, select it
        const conversation = conversations.find(c => c.id === existingConvo[0].conversation_id);
        if (conversation) {
          setCurrentConversation(conversation);
          return;
        }
      }
      
      // Create a new conversation
      const { data: newConversation, error: convoError } = await supabase
        .from('conversations')
        .insert([{}])
        .select()
        .single();
        
      if (convoError) throw convoError;
      
      // Add participants
      await supabase.from('conversation_participants').insert([
        { conversation_id: newConversation.id, user_id: user.id },
        { conversation_id: newConversation.id, user_id: participantId }
      ]);
      
      // Fetch the other participant's details
      const { data: participantData } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .eq('id', participantId)
        .single();
      
      if (!participantData) throw new Error('Participant not found');
      
      const newConvo: Conversation = {
        id: newConversation.id,
        created_at: newConversation.created_at,
        participants: [
          { 
            id: user.id, 
            email: user.email || '', 
            full_name: user.user_metadata?.full_name || 'You',
            avatar_url: user.user_metadata?.avatar_url
          },
          participantData
        ]
      };
      
      setConversations(prev => [newConvo, ...prev]);
      setCurrentConversation(newConvo);
      
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError('Failed to create conversation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, supabase, conversations]);

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${currentConversation?.id || ''}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          
          // If the message is from the current user, we've already added it via sendMessage
          if (newMessage.sender_id === user.id) return;
          
          setMessages(prev => [...prev, newMessage]);
          
          // Update the conversation's last message
          setConversations(prev => 
            prev.map(conv => 
              conv.id === newMessage.conversation_id
                ? { ...conv, last_message: newMessage }
                : conv
            )
          );
          
          // Update unread count
          if (currentConversation?.id === newMessage.conversation_id) {
            markAsRead(newMessage.conversation_id);
          } else {
            setUnreadCounts(prev => ({
              ...prev,
              [newMessage.conversation_id]: (prev[newMessage.conversation_id] || 0) + 1
            }));
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase, currentConversation, markAsRead]);

  // Initial data fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      fetchMessages();
    }
  }, [currentConversation, fetchMessages]);

  const value = {
    conversations,
    currentConversation,
    messages,
    loading,
    error,
    sendMessage,
    selectConversation,
    createNewConversation,
    unreadCounts,
    markAsRead
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging() {
  const context = useContext(MessagingContext);
  if (context === undefined) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
}
