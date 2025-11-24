import React, { useEffect, useState } from 'react';
import type { Badge } from '../types';

interface RewardNotificationProps {
  points: number;
  badge: Badge | null;
}

const RewardNotification: React.FC<RewardNotificationProps> = ({ points, badge }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (points > 0 || badge) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 4000); // Disappears after 4 seconds
      return () => clearTimeout(timer);
    }
  }, [points, badge]);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-500 text-white py-2 px-6 rounded-full shadow-lg z-50 animate-bounce">
      <div className="flex items-center gap-4">
        {badge && (
          <div className="text-center">
            <div className="text-2xl">{badge.icon}</div>
            <div className="font-bold text-sm">Badge Unlocked!</div>
            <div className="text-xs">{badge.name}</div>
          </div>
        )}
        {badge && points > 0 && <div className="border-l border-green-300 h-10"></div>}
        {points > 0 && (
          <div className="font-bold text-center">
             <span className="text-2xl">⭐</span>
             <p>+{points} Points!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardNotification;
