import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { useNotifications } from '@/hooks/useNotifications';

export const NotificationButton: React.FC = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const { unreadCount } = useNotifications();

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setShowNotifications(true)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      <NotificationCenter
        open={showNotifications}
        onOpenChange={setShowNotifications}
      />
    </>
  );
};