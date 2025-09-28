import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const LAST_ACTIVITY_KEY = 'lastActivity';

export const SessionIndicator: React.FC = () => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    const updateTimeRemaining = () => {
      const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
      if (!lastActivity) return;

      const timeSinceActivity = Date.now() - parseInt(lastActivity);
      const remaining = Math.max(0, SESSION_TIMEOUT - timeSinceActivity);
      setTimeRemaining(remaining);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getVariant = () => {
    if (timeRemaining > 5 * 60 * 1000) return 'default'; // > 5 min
    if (timeRemaining > 2 * 60 * 1000) return 'secondary'; // > 2 min
    return 'destructive'; // < 2 min
  };

  if (timeRemaining === 0) return null;

  return (
    <Badge variant={getVariant()} className="flex items-center gap-1">
      <Clock className="h-3 w-3" />
      {formatTime(timeRemaining)}
    </Badge>
  );
};
