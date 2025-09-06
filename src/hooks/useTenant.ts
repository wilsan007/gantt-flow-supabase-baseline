import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  status: string;
  subscription_plan?: string;
  max_users?: number;
  max_projects?: number;
}

interface TenantMember {
  id: string;
  tenant_id: string;
  user_id: string;
  role: string;
  status: string;
  permissions: any;
}

export const useTenant = () => {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [userMembership, setUserMembership] = useState<TenantMember | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserTenant = async () => {
    try {
      setLoading(true);
      
      // Récupérer l'appartenance de l'utilisateur au tenant
      const { data: membership, error: membershipError } = await supabase
        .from('tenant_members')
        .select(`
          *,
          tenant:tenants(*)
        `)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('status', 'active')
        .single();

      if (membershipError) {
        if (membershipError.code === 'PGRST116') {
          // Aucun tenant trouvé, créer un membre par défaut
          const { data: user } = await supabase.auth.getUser();
          if (user.user) {
            const { error: insertError } = await supabase
              .from('tenant_members')
              .insert({
                tenant_id: '00000000-0000-0000-0000-000000000001',
                user_id: user.user.id,
                role: 'admin',
                status: 'active',
                joined_at: new Date().toISOString()
              });

            if (insertError) {
              console.error('Error creating default membership:', insertError);
            } else {
              // Retry fetch after creating membership
              await fetchUserTenant();
              return;
            }
          }
        }
        throw membershipError;
      }

      setUserMembership(membership);
      setCurrentTenant(membership.tenant as Tenant);
    } catch (error) {
      console.error('Error fetching tenant:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les informations du tenant",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const switchTenant = async (tenantId: string) => {
    try {
      // Vérifier que l'utilisateur est membre de ce tenant
      const { data: membership, error } = await supabase
        .from('tenant_members')
        .select('*, tenant:tenants(*)')
        .eq('tenant_id', tenantId)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('status', 'active')
        .single();

      if (error) throw error;

      setUserMembership(membership);
      setCurrentTenant(membership.tenant as Tenant);
      
      toast({
        title: "Succès",
        description: `Basculé vers ${membership.tenant.name}`,
      });
    } catch (error) {
      console.error('Error switching tenant:', error);
      toast({
        title: "Erreur",
        description: "Impossible de basculer vers ce tenant",
        variant: "destructive",
      });
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!userMembership) return false;
    
    // Les admins et owners ont toutes les permissions
    if (['admin', 'owner'].includes(userMembership.role)) return true;
    
    // Vérifier les permissions spécifiques
    return userMembership.permissions?.[permission] === true;
  };

  const canManage = (resource: string): boolean => {
    return hasPermission(`manage_${resource}`) || hasPermission('manage_all');
  };

  useEffect(() => {
    fetchUserTenant();
  }, []);

  return {
    currentTenant,
    userMembership,
    loading,
    fetchUserTenant,
    switchTenant,
    hasPermission,
    canManage,
    isAdmin: userMembership?.role === 'admin' || userMembership?.role === 'owner',
    tenantId: currentTenant?.id
  };
};