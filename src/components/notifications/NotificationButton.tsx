import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { NotificationPopup } from './NotificationPopup';
import { useNotifications } from '@/hooks/useNotifications';

export const NotificationButton: React.FC = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const { unreadCount, getUnreadNotifications } = useNotifications();

  // Auto-show popup when user has high priority unread notifications
  useEffect(() => {
    const unreadNotifications = getUnreadNotifications();
    const hasHighPriorityUnread = unreadNotifications.some(
      n => n.priority === 'urgent' || n.priority === 'high'
    );
    
    if (hasHighPriorityUnread && unreadNotifications.length > 0) {
      // Show popup after a short delay to avoid interrupting user flow
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

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

      <NotificationPopup
        open={showPopup}
        onOpenChange={setShowPopup}
      />
    </>
  );
};