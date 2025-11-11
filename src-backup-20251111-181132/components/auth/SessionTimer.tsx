/**
 * Composant SessionTimer
 * Affiche le temps restant avant expiration de la session (2h)
 */

import React, { useState, useEffect } from 'react';
import { useStrictAuth } from '@/hooks/useStrictAuth';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Clock, AlertTriangle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SessionTimerProps {
  showAlert?: boolean; // Afficher alerte si < 5 min
  compact?: boolean; // Mode compact (badge seulement)
}

export const SessionTimer: React.FC<SessionTimerProps> = ({
  showAlert = true,
  compact = false,
}) => {
  const {
    isAuthenticated,
    getFormattedTimeRemaining,
    getTimeUntilExpiry,
    isExpiringSoon,
    signOut,
  } = useStrictAuth();

  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [expiringSoon, setExpiringSoon] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Mise à jour toutes les 10 secondes
    const interval = setInterval(() => {
      const formatted = getFormattedTimeRemaining();
      const soon = isExpiringSoon();

      setTimeRemaining(formatted);
      setExpiringSoon(soon);
    }, 10000); // 10 secondes

    // Première mise à jour immédiate
    setTimeRemaining(getFormattedTimeRemaining());
    setExpiringSoon(isExpiringSoon());

    return () => clearInterval(interval);
  }, [isAuthenticated, getFormattedTimeRemaining, isExpiringSoon]);

  if (!isAuthenticated || !timeRemaining) {
    return null;
  }

  // Mode compact : Badge seulement
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={expiringSoon ? 'destructive' : 'secondary'} className="gap-1">
              <Clock className="h-3 w-3" />
              {timeRemaining}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Session expire dans {timeRemaining}</p>
            <p className="mt-1 text-xs text-muted-foreground">Durée maximale : 2 heures</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Mode alerte (quand < 5 min)
  if (showAlert && expiringSoon) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Session expire bientôt</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            Votre session expire dans <strong>{timeRemaining}</strong>. Veuillez enregistrer votre
            travail.
          </span>
          <Button onClick={signOut} size="sm" variant="outline" className="ml-4">
            <LogOut className="mr-2 h-3 w-3" />
            Se déconnecter
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Mode normal : Badge avec tooltip
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex cursor-default items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5 transition-colors hover:bg-muted">
            <Clock
              className={`h-4 w-4 ${expiringSoon ? 'animate-pulse text-destructive' : 'text-muted-foreground'}`}
            />
            <span className={`text-sm font-medium ${expiringSoon ? 'text-destructive' : ''}`}>
              {timeRemaining}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">Temps restant de session</p>
            <p className="text-xs text-muted-foreground">Maximum : 2 heures par session</p>
            <p className="text-xs text-muted-foreground">Déconnexion automatique à l'expiration</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SessionTimer;
