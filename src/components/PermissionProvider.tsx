/**
 * Provider de Permissions - Initialisation Globale
 * Inspiré des meilleures pratiques de React Query, Zustand
 *
 * Fonctionnalités:
 * - Initialisation automatique
 * - Gestion des erreurs
 * - Loading states
 * - Cleanup automatique
 */

import React, { useEffect, useState } from 'react';
import { usePermissionStore } from '@/stores/permissionStore';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface PermissionProviderProps {
  children: React.ReactNode;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const { initialize, isInitialized, reset } = usePermissionStore();

  useEffect(() => {
    let mounted = true;

    const initializePermissions = async () => {
      try {
        await initialize();
      } catch (error) {
        console.error('Erreur initialisation permissions:', error);
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event);

      if (event === 'SIGNED_IN' && session) {
        // Utilisateur connecté - initialiser les permissions
        await initializePermissions();
      } else if (event === 'SIGNED_OUT') {
        // Utilisateur déconnecté - reset
        reset();
        setIsInitializing(false);
      }
    });

    // Initialisation initiale
    initializePermissions();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initialize, reset]);

  // Loading state pendant l'initialisation
  if (isInitializing || !isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Initialisation des permissions...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
