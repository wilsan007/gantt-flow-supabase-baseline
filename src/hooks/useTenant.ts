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

interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  tenant_id: string;
  context_type: string;
  context_id: string;
  is_active: boolean;
  roles: {
    name: string;
    display_name: string;
    hierarchy_level: number;
  };
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
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  console.log('🔄 useTenant hook initialized - using user_roles system');

  const fetchUserTenant = async () => {
    try {
      setLoading(true);
      
      // Récupérer l'utilisateur authentifié
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔍 Auth user:', user?.id);
      if (!user) {
        console.log('❌ No authenticated user found');
        return;
      }

      // Récupérer le profil utilisateur
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('🔍 Profile data:', profile);
      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }

      if (!profile || !profile.tenant_id) {
        console.log('❌ No profile or tenant_id found');
        return;
      }

      console.log('✅ Profile found with tenant_id:', profile.tenant_id);

      // Récupérer les rôles utilisateur depuis user_roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          *,
          roles!inner (
            name,
            display_name,
            hierarchy_level
          )
        `)
        .eq('user_id', user.id)
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true);

      if (rolesError) {
        console.error('Erreur lors de la récupération des rôles:', rolesError);
        throw rolesError;
      }

      if (!roles || roles.length === 0) {
        console.log('❌ Aucun rôle trouvé pour ce tenant');
        throw new Error('Aucun rôle actif trouvé pour ce tenant');
      }

      // Mettre à jour les états avec le bon type
      const typedRoles: UserRole[] = roles.map(role => ({
        ...role,
        roles: {
          name: role.roles.name,
          display_name: role.roles.display_name,
          hierarchy_level: role.roles.hierarchy_level || 0
        }
      }));
      
      setUserRoles(typedRoles);

      // Créer le tenant par défaut
      const defaultTenant = { 
        id: profile.tenant_id, 
        name: 'Wadashaqeen SaaS', 
        slug: 'wadashaqeen',
        status: 'active'
      };

      // Déterminer le rôle principal (le plus élevé dans la hiérarchie)
      const primaryRole = roles && roles.length > 0 
        ? roles.reduce((prev, current) => 
            (prev.roles.hierarchy_level < current.roles.hierarchy_level) ? prev : current
          )
        : null;

      // Créer l'objet membership basé sur user_roles
      const membership = {
        id: profile.id,
        tenant_id: profile.tenant_id,
        user_id: profile.user_id,
        role: primaryRole?.roles.name || 'user',
        status: 'active',
        permissions: generatePermissionsFromRoles(roles || []),
        tenant: defaultTenant
      };

      console.log('✅ Setting membership with role:', membership.role);
      setUserMembership(membership);
      setCurrentTenant(defaultTenant as Tenant);

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

  // Générer les permissions basées sur les rôles
  const generatePermissionsFromRoles = (roles: UserRole[]) => {
    const permissions: any = {};
    
    roles.forEach(role => {
      // Les admins et tenant_admins ont toutes les permissions
      if (['admin', 'tenant_admin'].includes(role.roles.name)) {
        permissions.admin = true;
        permissions.manage_all = true;
      }
      
      // HR managers ont les permissions HR
      if (role.roles.name === 'hr_manager') {
        permissions.manage_hr = true;
        permissions.manage_employees = true;
      }
      
      // Project managers ont les permissions projets
      if (role.roles.name === 'project_manager') {
        permissions.manage_projects = true;
        permissions.manage_tasks = true;
      }
    });
    
    return permissions;
  };

  const switchTenant = async (tenantId: string) => {
    try {
      // Vérifier que l'utilisateur a des rôles actifs dans ce tenant
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          roles:role_id (
            name,
            display_name,
            hierarchy_level
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('is_active', true);

      if (error) throw error;

      if (!roles || roles.length === 0) {
        throw new Error('Aucun rôle actif trouvé pour ce tenant');
      }

      // Typer correctement les rôles
      const typedRoles: UserRole[] = roles.map(role => ({
        ...role,
        roles: {
          name: role.roles.name,
          display_name: role.roles.display_name,
          hierarchy_level: role.roles.hierarchy_level || 0
        }
      }));

      // Mettre à jour les états
      setUserRoles(typedRoles);
      
      const newTenant = {
        id: tenantId,
        name: 'Wadashaqeen SaaS',
        slug: 'wadashaqeen',
        status: 'active'
      };

      const primaryRole = typedRoles.reduce((prev, current) => 
        (prev.roles.hierarchy_level < current.roles.hierarchy_level) ? prev : current
      );

      const membership = {
        id: primaryRole.id,
        tenant_id: tenantId,
        user_id: primaryRole.user_id,
        role: primaryRole.roles.name,
        status: 'active',
        permissions: generatePermissionsFromRoles(typedRoles),
        tenant: newTenant
      };

      setUserMembership(membership);
      setCurrentTenant(newTenant as Tenant);
      
      toast({
        title: "Succès",
        description: `Basculé vers le tenant avec le rôle ${primaryRole.roles.display_name}`,
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
    
    // Les admins et tenant_admins ont toutes les permissions
    if (['admin', 'tenant_admin', 'owner'].includes(userMembership.role)) return true;
    
    // Vérifier les permissions spécifiques
    return userMembership.permissions?.[permission] === true;
  };

  const canManage = (resource: string): boolean => {
    return hasPermission(`manage_${resource}`) || hasPermission('manage_all');
  };

  // Fonction pour vérifier si l'utilisateur a un rôle spécifique
  const hasRole = (roleName: string): boolean => {
    return userRoles.some(role => role.roles.name === roleName && role.is_active);
  };

  // Fonction pour obtenir tous les rôles actifs
  const getActiveRoles = (): string[] => {
    return userRoles.filter(role => role.is_active).map(role => role.roles.name);
  };

  useEffect(() => {
    fetchUserTenant();
  }, []);

  return {
    currentTenant,
    userMembership,
    userRoles,
    loading,
    fetchUserTenant,
    switchTenant,
    hasPermission,
    canManage,
    hasRole,
    getActiveRoles,
    isAdmin: userMembership?.role === 'admin' || userMembership?.role === 'tenant_admin' || userMembership?.role === 'owner',
    tenantId: currentTenant?.id
  };
};