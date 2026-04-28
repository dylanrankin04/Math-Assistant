
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import RewardNotification from './components/RewardNotification';
import ImageUploadModal from './components/ImageUploadModal';
import { sendMessage, clearChatSession } from './services/geminiService';
import { getBadgeById } from './data/badges';
import type { Message, Badge, ChatSession } from './types';
import { auth, signIn, signOut, ensureUserProfile, updateUserProfile, loadUserSessions, saveSession, deleteSession as fbDeleteSession } from './services/firebaseService';
import { onAuthStateChanged, User } from 'firebase/auth';

const DEFAULT_WELCOME: Message = {
  role: 'model',
  text: "Hello! I'm Mr. Rankin's Assistant. I'm here to help you understand your math problems. Tell me, which IXL skill are you working on today?",
};

const parseGamificationRewards = (text: string) => {
  let cleanText = text;
  let pointsAwarded = 0;
  let badgeId: string | null = null;

  const pointsRegex = /\[POINTS:(\d+)\]/g;
  let pointsMatch;
  while ((pointsMatch = pointsRegex.exec(text)) !== null) {
    pointsAwarded += parseInt(pointsMatch[1], 10);
  }
  cleanText = cleanText.replace(pointsRegex, '').trim();

  const badgeRegex = /\[BADGE:([\w_]+)\]/g;
  const badgeMatch = badgeRegex.exec(text);
  if (badgeMatch) {
    badgeId = badgeMatch[1];
  }
  cleanText = cleanText.replace(badgeRegex, '').trim();

  return { cleanText, pointsAwarded, badgeId };
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // --- Persistent State ---
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [points, setPoints] = useState<number>(0);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);

  // --- UI State ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [lastReward, setLastReward] = useState<{ points: number; badge: Badge | null }>({ points: 0, badge: null });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const profile = await ensureUserProfile(user.uid);
        if (profile) {
           setPoints(profile.points || 0);
           setEarnedBadges(profile.badges || []);
        }
        
        const userSessions = await loadUserSessions(user.uid);
        const sorted = userSessions.sort((a,b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        setSessions(sorted);
        if (sorted.length > 0) {
          setCurrentSessionId(sorted[0].id);
        } else {
          setCurrentSessionId('');
        }
      } else {
        setCurrentUser(null);
        setSessions([]);
        setCurrentSessionId('');
        setPoints(0);
        setEarnedBadges([]);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Sync profile when points or badges change
  useEffect(() => {
    if (currentUser && !authLoading) {
      updateUserProfile(currentUser.uid, points, earnedBadges);
    }
  }, [points, earnedBadges, currentUser, authLoading]);

  // Sync sessions when changed? No, we will save individually when modifying messages.

  // --- Helpers ---
  const getCurrentMessages = () => {
    if (!currentUser) return [];
    const session = sessions.find(s => s.id === currentSessionId);
    return session ? session.messages : [DEFAULT_WELCOME];
  };

  const handleNewChat = () => {
    if (!currentUser) return;
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      userId: currentUser.uid,
      title: 'New Chat',
      messages: [DEFAULT_WELCOME],
      updatedAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    clearChatSession();
    saveSession(currentUser.uid, newSession);
  };

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
    clearChatSession();
  };

  const handleDeleteSession = async (id: string) => {
    if (!currentUser) return;
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId('');
      clearChatSession();
    }
    await fbDeleteSession(currentUser.uid, id);
  };

  const handleSendMessage = async (userInput: string, imageBase64?: string) => {
    if ((!userInput.trim() && !imageBase64) || !currentUser) return;

    let sessionId = currentSessionId;
    let currentSessions = [...sessions];
    let sessionChanged = false;

    let sessionIndex = currentSessions.findIndex(s => s.id === sessionId);

    // If no active session or session not found, create one
    if (!sessionId || sessionIndex === -1) {
      sessionId = Date.now().toString();
      const newSession: ChatSession = {
        id: sessionId,
        userId: currentUser.uid, 
        title: userInput.slice(0, 30) + (userInput.length > 30 ? '...' : ''),
        messages: [DEFAULT_WELCOME],
        updatedAt: Date.now()
      };
      currentSessions = [newSession, ...currentSessions];
      sessionId = newSession.id;
      setCurrentSessionId(sessionId);
      sessionChanged = true;
      sessionIndex = 0;
    }

    const userMessage: Message = { role: 'user', text: userInput, image: imageBase64 };
    const updatedMessages = [...currentSessions[sessionIndex].messages, userMessage];

    // Optimistically update messages
    const newTitle = currentSessions[sessionIndex].title === 'New Chat' ? (userInput.slice(0, 30) || 'Image Problem') : currentSessions[sessionIndex].title;
    const optimisticSession = { ...currentSessions[sessionIndex], messages: updatedMessages, updatedAt: Date.now(), title: newTitle };
    setSessions(prev => prev.map(s => s.id === sessionId ? optimisticSession : s));
    
    // Save to firestore immediately so user input is visible on reload
    saveSession(currentUser.uid, optimisticSession);

    setIsLoading(true);
    setError(null);
    setLastReward({ points: 0, badge: null });

    try {
      const history = updatedMessages.slice(0, -1).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const modelResponseText = await sendMessage(userInput, imageBase64, history);
      const { cleanText, pointsAwarded, badgeId } = parseGamificationRewards(modelResponseText);
      
      const modelMessage: Message = { role: 'model', text: cleanText };
      
      const sessionAfterResponse = { ...optimisticSession, messages: [...optimisticSession.messages, modelMessage], updatedAt: Date.now() };
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? sessionAfterResponse : s
      ));
      saveSession(currentUser.uid, sessionAfterResponse);

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
      const errorSession = { ...optimisticSession, messages: [...optimisticSession.messages, { role: 'model', text: "Oops! Something went wrong. Please try again." }] };
      setSessions(prev => prev.map(s => s.id === sessionId ? errorSession : s));
      saveSession(currentUser.uid, errorSession);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = (messageText: string) => {
    const prompt = `I'd like to review this part: "${messageText}". \n\nCan you explain it again in a different way and give me a practice mini-problem?`;
    handleSendMessage(prompt);
  };

  const handleResetAll = async () => {
    if (!currentUser) return;
    if (window.confirm("This will erase ALL chat history and ALL points. Are you sure?")) {
        for (const session of sessions) {
             await fbDeleteSession(currentUser.uid, session.id);
        }
        setSessions([]);
        setCurrentSessionId('');
        setPoints(0);
        setEarnedBadges([]);
        clearChatSession();
        // updateUserProfile triggered by effect
    }
  };

  const handleSignOut = async () => {
     if (window.confirm("Are you sure you want to log out?")) {
         await signOut();
     }
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full mx-4 text-center">
            <h1 className="text-3xl font-bold text-blue-600 mb-2">Mr. Rankin's Assistant</h1>
            <p className="text-gray-500 mb-8">Sign in to start learning math, earn points, and save your progress!</p>
            <button 
               onClick={signIn}
               className="w-full py-3 px-4 bg-white border border-gray-300 rounded-xl shadow-sm text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 cursor-pointer"
            >
               <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
               Sign in with Google
            </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-900 overflow-hidden">
      <Sidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <Header 
          points={points} 
          badgeCount={earnedBadges.length} 
          onReset={handleResetAll} 
          onToggleSidebar={() => setIsSidebarOpen(true)}
        />
        
        {/* Sign Out Button in Header or top right corner */}
        <div className="absolute top-4 right-4 z-50 hidden sm:block">
           <button onClick={handleSignOut} className="text-xs font-medium text-gray-500 hover:text-gray-800 bg-white shadow-sm border border-gray-200 px-3 py-1.5 rounded-lg cursor-pointer">
              Sign Out
           </button>
        </div>

        <RewardNotification points={lastReward.points} badge={lastReward.badge} />
        
        <ImageUploadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSend={(prompt, image) => {
            handleSendMessage(prompt, image);
            setIsModalOpen(false);
          }}
        />

        <main className="flex-1 overflow-hidden relative">
          <ChatWindow 
            messages={getCurrentMessages()} 
            isLoading={isLoading} 
            onReview={handleReview}
          />
          {/* Mobile Sign out */}
          <div className="absolute bottom-2 left-2 z-50 sm:hidden">
             <button onClick={handleSignOut} className="text-xs font-medium text-gray-500 hover:text-gray-800 bg-white/80 backdrop-blur shadow-sm border border-gray-200 px-2 py-1 rounded-md cursor-pointer">
                Sign Out
             </button>
          </div>
        </main>

        <footer className="bg-white border-t border-gray-200 p-2 sm:p-4">
          <ChatInput 
              onSendMessage={(text) => handleSendMessage(text)} 
              isLoading={isLoading}
              onUploadClick={() => setIsModalOpen(true)}
          />
          {error && (
            <div className="text-red-600 text-center text-sm mt-3 p-3 bg-red-50 rounded-xl border border-red-200 flex flex-col sm:flex-row items-center justify-center gap-2 animate-pulse">
              <span className="flex items-center gap-1.5 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </span>
              <button 
                onClick={() => {
                  const lastUserMsg = sessions.find(s => s.id === currentSessionId)?.messages
                    .filter(m => m.role === 'user')
                    .pop();
                  if (lastUserMsg) {
                    handleSendMessage(lastUserMsg.text, lastUserMsg.image);
                  } else {
                    setError(null);
                  }
                }}
                className="text-red-700 underline font-bold hover:text-red-900 transition-colors cursor-pointer"
              >
                Try again
              </button>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
};

export default App;
