import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InactivityTimerConfig {
  totalTimeoutMinutes?: number; // Temps total avant déconnexion (défaut: 15 min)
  warningMinutes?: number; // Quand commencer à afficher l'avertissement (défaut: 5 min)
  enabled?: boolean; // Activer/désactiver le minuteur
}

/**
 * Hook pour gérer le minuteur d'inactivité avec déconnexion automatique
 * Affiche un avertissement seulement dans les dernières minutes
 */
export const useInactivityTimer = (config: InactivityTimerConfig = {}) => {
  const {
    totalTimeoutMinutes = 15,
    warningMinutes = 5,
    enabled = true
  } = config;

  const [timeLeft, setTimeLeft] = useState(totalTimeoutMinutes * 60); // En secondes
  const [showWarning, setShowWarning] = useState(false);
  const [isActive, setIsActive] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const { toast } = useToast();

  // Calculer si on doit afficher l'avertissement
  const shouldShowWarning = timeLeft <= (warningMinutes * 60) && timeLeft > 0;

  // Formater le temps restant
  const formatTimeLeft = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Réinitialiser le minuteur
  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setTimeLeft(totalTimeoutMinutes * 60);
    setShowWarning(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (enabled) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - lastActivityRef.current) / 1000);
        const remaining = (totalTimeoutMinutes * 60) - elapsed;
        
        if (remaining <= 0) {
          handleTimeout();
        } else {
          setTimeLeft(remaining);
          setShowWarning(remaining <= (warningMinutes * 60));
        }
      }, 1000);
    }
  }, [enabled, totalTimeoutMinutes, warningMinutes]);

  // Gérer la déconnexion automatique
  const handleTimeout = useCallback(async () => {
    // console.log('🕐 Déconnexion automatique - inactivité détectée');
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setIsActive(false);
    setShowWarning(false);
    
    toast({
      title: '⏰ Session expirée',
      description: 'Vous avez été déconnecté pour inactivité',
      variant: 'destructive',
      duration: 5000
    });

    try {
      await supabase.auth.signOut();
      // La redirection sera gérée par l'App.tsx qui écoute les changements d'auth
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  }, [toast]);

  // Démarrer le minuteur
  const startTimer = useCallback(() => {
    if (!enabled) return;
    
    // console.log(`🕐 Minuteur d'inactivité démarré: ${totalTimeoutMinutes} minutes`);
    setIsActive(true);
    resetTimer();
  }, [enabled, resetTimer, totalTimeoutMinutes]);

  // Arrêter le minuteur
  const stopTimer = useCallback(() => {
    // console.log('🕐 Minuteur d\'inactivité arrêté');
    setIsActive(false);
    setShowWarning(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Gérer l'activité utilisateur
  const handleUserActivity = useCallback(() => {
    if (!enabled || !isActive) return;
    
    lastActivityRef.current = Date.now();
    setTimeLeft(totalTimeoutMinutes * 60);
    setShowWarning(false);
  }, [enabled, isActive, totalTimeoutMinutes]);

  // Écouter les événements d'activité utilisateur
  useEffect(() => {
    if (!enabled || !isActive) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [enabled, isActive, handleUserActivity]);

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Démarrer automatiquement si activé
  useEffect(() => {
    if (enabled) {
      startTimer();
    } else {
      stopTimer();
    }
  }, [enabled, startTimer, stopTimer]);

  return {
    timeLeft,
    timeLeftFormatted: formatTimeLeft(timeLeft),
    showWarning: shouldShowWarning,
    isActive,
    startTimer,
    stopTimer,
    resetTimer,
    handleUserActivity
  };
};
