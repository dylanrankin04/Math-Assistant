import React from 'react';

interface HeaderProps {
    points: number;
    badgeCount: number;
}

const Header: React.FC<HeaderProps> = ({ points, badgeCount }) => {
  return (
    <header className="bg-white shadow-md w-full z-10 p-4">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Mr. Rankin's Math Assistant
            </h1>
            <p className="text-sm text-gray-500 mt-1">IXL & Common Core Help for Grades 6-8</p>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
            <div className="text-center">
                <div className="text-yellow-500 text-2xl">⭐</div>
                <div className="font-bold text-gray-700">{points}</div>
            </div>
            <div className="text-center">
                <div className="text-yellow-500 text-2xl">🏆</div>
                <div className="font-bold text-gray-700">{badgeCount}</div>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
