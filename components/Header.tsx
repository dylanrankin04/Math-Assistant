
import React from 'react';

interface HeaderProps {
    points: number;
    badgeCount: number;
    onReset: () => void;
    onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ points, badgeCount, onReset, onToggleSidebar }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 w-full z-10 p-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
            {/* Hamburger for mobile */}
            <button 
                onClick={onToggleSidebar}
                className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            <div className="flex flex-col">
                <h1 className="text-lg sm:text-2xl font-bold text-blue-600 leading-tight">
                    Mr. Rankin's Assistant
                </h1>
                <p className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wider">IXL Math Coach</p>
            </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-6">
            <div className="flex items-center gap-1 sm:gap-1.5 bg-yellow-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-yellow-200 shadow-sm">
                <span className="text-base sm:text-lg">⭐</span>
                <span className="font-bold text-yellow-700 text-xs sm:text-base">{points}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 bg-blue-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-blue-200 shadow-sm">
                <span className="text-base sm:text-lg">🏆</span>
                <span className="font-bold text-blue-700 text-xs sm:text-base">{badgeCount}</span>
            </div>
            
            <button 
                onClick={onReset}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                title="Reset All Progress"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
