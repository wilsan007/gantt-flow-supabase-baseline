import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LastGoogleAccount {
  email: string;
  fullName: string;
  avatarUrl?: string;
  provider: 'google' | 'azure';
}

const STORAGE_KEY = 'wadashaqeen_last_oauth_account';

/**
 * Hook pour mémoriser et récupérer le dernier compte OAuth utilisé
 */
export const useLastGoogleAccount = () => {
  const [lastAccount, setLastAccount] = useState<LastGoogleAccount | null>(null);

  // Charger le dernier compte au montage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const account = JSON.parse(stored);
        setLastAccount(account);
      } catch (error) {
        console.error('Erreur lors du chargement du dernier compte:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Écouter les changements d'authentification pour sauvegarder
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const user = session.user;

        // Vérifier si c'est une connexion OAuth (Google ou Microsoft)
        const provider = user.app_metadata.provider;
        if (provider === 'google' || provider === 'azure') {
          const accountData: LastGoogleAccount = {
            email: user.email || '',
            fullName: user.user_metadata.full_name || user.user_metadata.name || 'Utilisateur',
            avatarUrl: user.user_metadata.avatar_url || user.user_metadata.picture,
            provider: provider as 'google' | 'azure',
          };

          // Sauvegarder dans localStorage
          localStorage.setItem(STORAGE_KEY, JSON.stringify(accountData));
          setLastAccount(accountData);
        }
      } else if (event === 'SIGNED_OUT') {
        // Ne pas supprimer le compte mémorisé lors de la déconnexion
        // On veut le garder pour permettre la reconnexion rapide
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const clearLastAccount = () => {
    localStorage.removeItem(STORAGE_KEY);
    setLastAccount(null);
  };

  return {
    lastAccount,
    clearLastAccount,
    hasLastAccount: !!lastAccount,
  };
};
