import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes en millisecondes
const LAST_ACTIVITY_KEY = 'lastActivity';
const MANUAL_LOGOUT_KEY = 'manualLogout';

export const useSessionManager = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Mettre à jour l'activité utilisateur
  const updateActivity = useCallback(() => {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  }, []);

  // Vérifier si la session a expiré
  const isSessionExpired = useCallback(() => {
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    const manualLogout = localStorage.getItem(MANUAL_LOGOUT_KEY);
    
    // Si déconnexion manuelle, forcer la reconnexion
    if (manualLogout === 'true') {
      return true;
    }
    
    if (!lastActivity) return true;
    
    const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
    return timeSinceLastActivity > SESSION_TIMEOUT;
  }, []);

  // Déconnexion sécurisée
  const signOut = useCallback(async () => {
    try {
      // Marquer comme déconnexion manuelle
      localStorage.setItem(MANUAL_LOGOUT_KEY, 'true');
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      
      // Déconnecter de Supabase
      await supabase.auth.signOut();
      
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  }, []);

  // Initialiser la session
  const initializeSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && !isSessionExpired()) {
        setUser(session.user);
        setSession(session);
        updateActivity();
        // Nettoyer le flag de déconnexion manuelle
        localStorage.removeItem(MANUAL_LOGOUT_KEY);
      } else if (session && isSessionExpired()) {
        // Session expirée, forcer la déconnexion
        await supabase.auth.signOut();
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        localStorage.removeItem(MANUAL_LOGOUT_KEY);
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la session:', error);
    } finally {
      setLoading(false);
    }
  }, [isSessionExpired, updateActivity]);

  // Gérer les changements d'état d'authentification
  const handleAuthStateChange = useCallback((user: User | null, session: Session | null) => {
    if (user && session) {
      setUser(user);
      setSession(session);
      updateActivity();
      localStorage.removeItem(MANUAL_LOGOUT_KEY);
    } else {
      setUser(null);
      setSession(null);
    }
    setLoading(false);
  }, [updateActivity]);

  // Surveiller l'activité utilisateur
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      if (user) {
        updateActivity();
      }
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [user, updateActivity]);

  // Vérifier périodiquement l'expiration de la session
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      if (isSessionExpired()) {
        signOut();
      }
    }, 60000); // Vérifier chaque minute

    return () => clearInterval(interval);
  }, [user, isSessionExpired, signOut]);

  // Initialiser au montage
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  return {
    user,
    session,
    loading,
    signOut,
    handleAuthStateChange,
    updateActivity
  };
};
