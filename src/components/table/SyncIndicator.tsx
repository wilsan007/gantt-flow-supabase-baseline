/**
 * SyncIndicator - Indicateur de synchronisation
 * Pattern: Real-time sync indicator (Notion/Figma)
 */

import React from 'react';
import { CheckCircle2, Loader2, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncIndicatorProps {
  status: 'synced' | 'syncing' | 'error';
  lastSync?: Date;
  className?: string;
}

export const SyncIndicator: React.FC<SyncIndicatorProps> = ({ 
  status, 
  lastSync,
  className 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'synced':
        return {
          icon: CheckCircle2,
          text: 'Synchronisé',
          color: 'text-green-500',
        };
      case 'syncing':
        return {
          icon: Loader2,
          text: 'Synchronisation...',
          color: 'text-blue-500',
          animate: true,
        };
      case 'error':
        return {
          icon: WifiOff,
          text: 'Erreur de sync',
          color: 'text-destructive',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      <Icon 
        className={cn(
          'h-4 w-4',
          config.color,
          config.animate && 'animate-spin'
        )} 
      />
      <span className={cn('font-medium', config.color)}>
        {config.text}
      </span>
      {lastSync && status === 'synced' && (
        <span className="text-muted-foreground">
          • {lastSync.toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      )}
    </div>
  );
};
