
import React from 'react';
import { ChatSession } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, 
  currentSessionId, 
  onSelectSession, 
  onNewChat, 
  onDeleteSession,
  isOpen,
  onClose
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Sidebar Content */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-72 bg-gray-900 text-white z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 flex flex-col h-full">
          <button 
            onClick={() => { onNewChat(); onClose(); }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors font-medium mb-6"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Chat
          </button>

          <div className="flex-1 overflow-y-auto space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Recent Chats</h3>
            {sessions.length === 0 ? (
              <p className="text-sm text-gray-500 px-2 italic">No history yet</p>
            ) : (
              sessions.sort((a, b) => b.updatedAt - a.updatedAt).map(session => (
                <div 
                  key={session.id}
                  className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${currentSessionId === session.id ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
                  onClick={() => { onSelectSession(session.id); onClose(); }}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span className="text-sm truncate font-medium">
                      {session.title || 'Untitled Session'}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t border-gray-800 mt-4 px-2">
            <p className="text-xs text-gray-500 text-center">Your progress is saved globally.</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
