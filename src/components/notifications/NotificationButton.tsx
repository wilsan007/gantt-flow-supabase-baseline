import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellRing } from 'lucide-react';
import { NotificationPopup } from './NotificationPopup';
import { useNotifications } from '@/hooks/useNotifications';

export const NotificationButton: React.FC = () => {
  const [showPopup, setShowPopup] = useState(false);
  const { unviewedCount } = useNotifications();

  // Utiliser unviewedCount (nouvelles notifications) pour l'affichage principal
  const displayCount = unviewedCount;
  const hasNewNotifications = unviewedCount > 0;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setShowPopup(true)}
      >
        {hasNewNotifications ? (
          <BellRing className="h-4 w-4 text-blue-600" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
        {displayCount > 0 && (
          <Badge 
            variant={hasNewNotifications ? "destructive" : "secondary"}
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-[20px]"
          >
            {displayCount > 99 ? '99+' : displayCount}
          </Badge>
        )}
      </Button>
      
      <NotificationPopup 
        open={showPopup} 
        onOpenChange={setShowPopup}
      />
    </>
  );
};