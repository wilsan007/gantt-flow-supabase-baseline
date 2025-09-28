import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  tenant?: Tenant;
}

interface TenantContextType {
  currentTenant: Tenant | null;
  userMembership: TenantMember | null;
  tenantId: string | null;
  loading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

let tenantCache: {
  currentTenant: Tenant | null;
  userMembership: TenantMember | null;
  tenantId: string | null;
  loading: boolean;
} | null = null;

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [userMembership, setUserMembership] = useState<TenantMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Si on a déjà les données en cache, les utiliser
    if (tenantCache && !tenantCache.loading) {
      setCurrentTenant(tenantCache.currentTenant);
      setUserMembership(tenantCache.userMembership);
      setLoading(false);
      return;
    }

    let isMounted = true; // Éviter les updates si le composant est démonté

    const fetchUserTenant = async () => {
      try {
        // console.log('🏢 TenantProvider: Fetching tenant data...');
        setLoading(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Vérifier le profil directement
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          // Si pas de profil trouvé, c'est peut-être un nouveau tenant owner
          if (profileError.code === 'PGRST116') {
            console.log('Aucun profil trouvé - possiblement un nouveau tenant owner');
            setLoading(false);
            return;
          }
          console.error('Error fetching profile:', profileError);
          setLoading(false);
          return;
        }

        if (profile && profile.tenant_id) {
          const defaultTenant = { 
            id: profile.tenant_id, 
            name: 'Wadashaqeen SaaS', 
            slug: 'wadashaqeen',
            status: 'active'
          };

          const membership = {
            id: profile.id,
            tenant_id: profile.tenant_id,
            user_id: profile.user_id,
            role: profile.role || 'admin',
            status: 'active',
            permissions: { admin: true, manage_all: true },
            tenant: defaultTenant
          };

          // Mettre en cache
          tenantCache = {
            currentTenant: defaultTenant as Tenant,
            userMembership: membership,
            tenantId: profile.tenant_id,
            loading: false
          };

          if (isMounted) {
            setCurrentTenant(defaultTenant as Tenant);
            setUserMembership(membership);
            // console.log('✅ TenantProvider: Tenant loaded and cached');
          }
        }
      } catch (error) {
        console.error('Error in TenantProvider:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUserTenant();

    return () => {
      isMounted = false; // Cleanup
    };
  }, []);

  const tenantId = currentTenant?.id || null;

  return (
    <TenantContext.Provider value={{ currentTenant, userMembership, tenantId, loading }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
