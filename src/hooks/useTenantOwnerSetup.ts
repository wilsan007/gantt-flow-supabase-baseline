import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TenantOwnerSetupState {
  isLoading: boolean;
  isPendingTenantOwner: boolean;
  hasCompletedSetup: boolean;
  userEmail: string | null;
  error: string | null;
}

export const useTenantOwnerSetup = () => {
  const [state, setState] = useState<TenantOwnerSetupState>({
    isLoading: true,
    isPendingTenantOwner: false,
    hasCompletedSetup: false,
    userEmail: null,
    error: null
  });

  useEffect(() => {
    checkTenantOwnerStatus();
  }, []);

  const checkTenantOwnerStatus = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Récupérer l'utilisateur connecté
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          isPendingTenantOwner: false,
          hasCompletedSetup: false 
        }));
        return;
      }

      // Vérifier si l'utilisateur a déjà un profil (setup terminé)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, tenant_id, role')
        .eq('user_id', user.id)
        .single();

      if (profile && profile.tenant_id) {
        // L'utilisateur a déjà un tenant, setup terminé
        setState(prev => ({
          ...prev,
          isLoading: false,
          isPendingTenantOwner: false,
          hasCompletedSetup: true,
          userEmail: user.email
        }));
        return;
      }

      // Vérifier s'il y a une invitation tenant_owner en attente pour cet email
      const { data: isPending, error: pendingError } = await supabase
        .rpc('is_pending_tenant_owner', { user_email: user.email });

      if (pendingError) {
        console.error('Erreur vérification invitation:', pendingError);
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Erreur lors de la vérification de l\'invitation' 
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        isPendingTenantOwner: isPending || false,
        hasCompletedSetup: false,
        userEmail: user.email
      }));

    } catch (error: any) {
      console.error('Erreur checkTenantOwnerStatus:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Erreur lors de la vérification du statut' 
      }));
    }
  };

  const refreshStatus = () => {
    checkTenantOwnerStatus();
  };

  return {
    ...state,
    refreshStatus
  };
};
