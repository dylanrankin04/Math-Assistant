import React, { useState } from 'react';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import RewardNotification from './components/RewardNotification';
import ImageUploadModal from './components/ImageUploadModal';
import { sendMessage } from './services/geminiService';
import { getBadgeById } from './data/badges';
import type { Message, Badge } from './types';

// Helper to parse rewards from the model's response
const parseGamificationRewards = (text: string) => {
  let cleanText = text;
  let pointsAwarded = 0;
  let badgeId: string | null = null;

  // Regex to find [POINTS:XX]
  const pointsRegex = /\[POINTS:(\d+)\]/g;
  let pointsMatch;
  while ((pointsMatch = pointsRegex.exec(text)) !== null) {
    pointsAwarded += parseInt(pointsMatch[1], 10);
  }
  cleanText = cleanText.replace(pointsRegex, '').trim();

  // Regex to find [BADGE:ID]
  const badgeRegex = /\[BADGE:([\w_]+)\]/g;
  const badgeMatch = badgeRegex.exec(text);
  if (badgeMatch) {
    badgeId = badgeMatch[1];
  }
  cleanText = cleanText.replace(badgeRegex, '').trim();

  return { cleanText, pointsAwarded, badgeId };
};


const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: "Hello! I'm Mr. Rankin's Assistant. I'm here to help you understand your math problems. Tell me, which IXL skill are you working on today?",
    },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Gamification state
  const [points, setPoints] = useState<number>(0);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [lastReward, setLastReward] = useState<{ points: number; badge: Badge | null }>({ points: 0, badge: null });

  const handleSendMessage = async (userInput: string, imageBase64?: string) => {
    if (!userInput.trim() && !imageBase64) return;

    const userMessage: Message = { role: 'user', text: userInput, image: imageBase64 };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsLoading(true);
    setError(null);
    setLastReward({ points: 0, badge: null }); // Clear previous reward notification

    try {
      const modelResponseText = await sendMessage(userInput, imageBase64);
      
      const { cleanText, pointsAwarded, badgeId } = parseGamificationRewards(modelResponseText);
      
      const modelMessage: Message = { role: 'model', text: cleanText };
      setMessages((prevMessages) => [...prevMessages, modelMessage]);

      let newBadge: Badge | null = null;
      if (badgeId && !earnedBadges.includes(badgeId)) {
        setEarnedBadges(prev => [...prev, badgeId]);
        newBadge = getBadgeById(badgeId) || null;
      }

      if (pointsAwarded > 0 || newBadge) {
          setPoints(prev => prev + pointsAwarded);
          setLastReward({ points: pointsAwarded, badge: newBadge });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      const errorModelMessage: Message = { role: 'model', text: "Oops! Something went wrong. Please try again." };
      setMessages((prevMessages) => [...prevMessages, errorModelMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = (messageText: string) => {
    const prompt = `I'd like to review this part: "${messageText}". \n\nCan you explain it again in a different way and give me a practice mini-problem?`;
    handleSendMessage(prompt);
  };
  
  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      <Header points={points} badgeCount={earnedBadges.length} />
      <RewardNotification points={lastReward.points} badge={lastReward.badge} />
       <ImageUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSend={(prompt, image) => {
          handleSendMessage(prompt, image);
          setIsModalOpen(false);
        }}
      />
      <main className="flex-1 overflow-hidden">
        <ChatWindow 
          messages={messages} 
          isLoading={isLoading} 
          onReview={handleReview}
        />
      </main>
      <footer className="bg-white border-t border-gray-200 p-2 sm:p-4">
        <ChatInput 
            onSendMessage={(text) => handleSendMessage(text)} 
            isLoading={isLoading}
            onUploadClick={() => setIsModalOpen(true)}
        />
        {error && <p className="text-red-500 text-center text-sm mt-2">{error}</p>}
      </footer>
    </div>
  );
};

export default App;