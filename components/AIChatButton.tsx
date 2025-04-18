'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

const QUICK_RESPONSES = [
  'What cars do you have available?',
  'How can I list my car?',
  'I need help with financing',
];

export default function AIChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: 'Hello! How can I assist you today?',
      isUser: false,
      timestamp: new Date(),
      status: 'sent',
    },
  ]);

  // Persist chat history in localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatHistory');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
  }, [messages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update unread count when chat is closed
  useEffect(() => {
    if (!isOpen) {
      const newMessages = messages.filter(msg => !msg.isUser).length;
      setUnreadCount(newMessages);
    } else {
      setUnreadCount(0);
    }
  }, [isOpen, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (text: string = message) => {
    if (!text.trim()) return;

    // Add user message
    const newMessage: Message = {
      id: Date.now(),
      text: text,
      isUser: true,
      timestamp: new Date(),
      status: 'sending',
    };
    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    setIsTyping(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get AI response based on user message
      const aiResponse = getAIResponse(text);
      
      // Update user message status to sent
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg
        )
      );

      // Add AI response
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
        status: 'sent',
      }]);
    } catch (error) {
      // Handle error
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id ? { ...msg, status: 'error' } : msg
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const getAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      return 'Our car prices vary based on make, model, and condition. Would you like to see our current listings with prices?';
    }
    if (lowerMessage.includes('list') || lowerMessage.includes('sell')) {
      return 'To list your car, you\'ll need to create an account and provide details about your vehicle. Would you like me to guide you through the process?';
    }
    if (lowerMessage.includes('finance') || lowerMessage.includes('loan')) {
      return 'We offer various financing options through our partner banks. Would you like to learn more about our financing packages?';
    }
    
    return 'Thank you for your message. How else can I assist you today?';
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now(),
      text: 'Hello! How can I assist you today?',
      isUser: false,
      timestamp: new Date(),
      status: 'sent',
    }]);
    localStorage.removeItem('chatHistory');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative bg-qatar-maroon text-white rounded-full p-3 shadow-lg hover:bg-qatar-maroon/90 transition-all duration-200 hover:scale-105"
        aria-label="Open AI Chat"
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <>
            <ChatBubbleLeftRightIcon className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
            <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-gray-900 text-white text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Chat with AI
            </span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-20 right-0 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-qatar-maroon text-white p-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold">AI Assistant</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="text-white/80 hover:text-white text-sm"
              >
                Clear Chat
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 flex flex-col gap-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl p-3 ${
                    msg.isUser
                      ? 'bg-qatar-maroon text-white rounded-br-none'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
                  }`}
                >
                  <div>{msg.text}</div>
                  <div className="text-xs mt-1 opacity-70">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {msg.isUser && (
                      <span className="ml-2">
                        {msg.status === 'sending' && '• Sending...'}
                        {msg.status === 'error' && '• Failed to send'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-3 text-gray-900 dark:text-white">
                  <div className="flex gap-1">
                    <span className="animate-bounce">•</span>
                    <span className="animate-bounce delay-100">•</span>
                    <span className="animate-bounce delay-200">•</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Responses */}
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 flex gap-2 overflow-x-auto">
            {QUICK_RESPONSES.map((response, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(response)}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 whitespace-nowrap"
              >
                {response}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-qatar-maroon"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!message.trim() || isTyping}
                className="p-2 rounded-xl bg-qatar-maroon text-white hover:bg-qatar-maroon/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
