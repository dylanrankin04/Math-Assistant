import React, { useEffect, useRef } from 'react';
import type { Message } from '../types';
import ChatBubble from './ChatBubble';
import LoadingSpinner from './LoadingSpinner';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onReview: (text: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, onReview }) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-4">
      {messages.map((msg, index) => (
        <ChatBubble 
          key={index} 
          role={msg.role} 
          text={msg.text} 
          image={msg.image}
          onReview={onReview}
        />
      ))}
      {isLoading && (
        <div className="flex justify-start">
            <div className="flex items-center space-x-2 bg-gray-200 rounded-lg p-3 max-w-lg">
                <LoadingSpinner />
                <span className="text-gray-600 italic">Thinking...</span>
            </div>
        </div>
      )}
      <div ref={chatEndRef} />
    </div>
  );
};

export default ChatWindow;