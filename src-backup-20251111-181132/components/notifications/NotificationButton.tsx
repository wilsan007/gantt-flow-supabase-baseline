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
      <Button variant="ghost" size="sm" className="relative" onClick={() => setShowPopup(true)}>
        {hasNewNotifications ? (
          <BellRing className="h-4 w-4 text-blue-600" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
        {displayCount > 0 && (
          <Badge
            variant={hasNewNotifications ? 'destructive' : 'secondary'}
            className="absolute -right-1 -top-1 flex h-5 w-5 min-w-[20px] items-center justify-center p-0 text-xs"
          >
            {displayCount > 99 ? '99+' : displayCount}
          </Badge>
        )}
      </Button>

      <NotificationPopup open={showPopup} onOpenChange={setShowPopup} />
    </>
  );
};
