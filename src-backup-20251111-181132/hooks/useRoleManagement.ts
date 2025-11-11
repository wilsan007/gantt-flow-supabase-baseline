import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  hierarchy_level: number;
  is_system_role: boolean;
}

export interface Permission {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  resource: string;
  action: string;
  context?: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  context_type?: string;
  context_id?: string;
  is_active: boolean;
  expires_at?: string;
  role: Role;
}

export const useRoleManagement = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase.from('roles').select('*').order('hierarchy_level');

      if (error) throw error;
      setRoles(data || []);
    } catch (error: any) {
      console.error('Error fetching roles:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les rôles',
        variant: 'destructive',
      });
    }
  };

  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('resource, action');

      if (error) throw error;
      setPermissions(data || []);
    } catch (error: any) {
      console.error('Error fetching permissions:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les permissions',
        variant: 'destructive',
      });
    }
  };

  const fetchUserRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(
          `
          *,
          role:roles(*)
        `
        )
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserRoles(data || []);
    } catch (error: any) {
      console.error('Error fetching user roles:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les rôles utilisateurs',
        variant: 'destructive',
      });
    }
  };

  const assignUserRole = async (
    userId: string,
    roleId: string,
    contextType?: string,
    contextId?: string,
    expiresAt?: string
  ) => {
    try {
      const { error } = await supabase.from('user_roles').insert({
        user_id: userId,
        role_id: roleId,
        context_type: contextType,
        context_id: contextId,
        expires_at: expiresAt,
      });

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Rôle assigné avec succès',
      });

      fetchUserRoles();
    } catch (error: any) {
      console.error('Error assigning role:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'assigner le rôle",
        variant: 'destructive',
      });
    }
  };

  const removeUserRole = async (userRoleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('id', userRoleId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Rôle retiré avec succès',
      });

      fetchUserRoles();
    } catch (error: any) {
      console.error('Error removing role:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de retirer le rôle',
        variant: 'destructive',
      });
    }
  };

  const getUserPermissions = async (userId?: string) => {
    try {
      const { data, error } = await supabase.rpc('get_user_roles', {
        p_user_id: userId,
      });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching user permissions:', error);
      return [];
    }
  };

  const checkUserPermission = async (
    resource: string,
    action: string,
    context?: string,
    contextId?: string
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select(
          `
          *,
          roles:role_id (name)
        `
        )
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) return false;

      // Les admins ont toutes les permissions
      return (
        userRoles?.some(role => ['admin', 'tenant_admin', 'owner'].includes(role.roles.name)) ||
        false
      );
    } catch (error: any) {
      console.error('Error checking permission:', error);
      return false;
    }
  };

  const canAccessResource = async (
    resourceType: string,
    resourceId: string,
    action: string = 'read'
  ) => {
    // Utiliser la même logique que checkUserPermission
    return await checkUserPermission(resourceType, action);
  };

  const getRolePermissions = async (roleId: string) => {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select(
          `
          permission:permissions(*)
        `
        )
        .eq('role_id', roleId);

      if (error) throw error;
      return data?.map(rp => rp.permission) || [];
    } catch (error: any) {
      console.error('Error fetching role permissions:', error);
      return [];
    }
  };

  const updateRolePermissions = async (roleId: string, permissionIds: string[]) => {
    try {
      // Remove existing permissions
      await supabase.from('role_permissions').delete().eq('role_id', roleId);

      // Add new permissions
      const { error } = await supabase.from('role_permissions').insert(
        permissionIds.map(permissionId => ({
          role_id: roleId,
          permission_id: permissionId,
        }))
      );

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Permissions du rôle mises à jour',
      });
    } catch (error: any) {
      console.error('Error updating role permissions:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour les permissions',
        variant: 'destructive',
      });
    }
  };

  const getPermissionsByResource = () => {
    const grouped = permissions.reduce(
      (acc, permission) => {
        if (!acc[permission.resource]) {
          acc[permission.resource] = [];
        }
        acc[permission.resource].push(permission);
        return acc;
      },
      {} as Record<string, Permission[]>
    );

    return grouped;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchRoles(), fetchPermissions(), fetchUserRoles()]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    roles,
    permissions,
    userRoles,
    loading,
    assignUserRole,
    removeUserRole,
    getUserPermissions,
    checkUserPermission,
    canAccessResource,
    getRolePermissions,
    updateRolePermissions,
    getPermissionsByResource,
    refetch: () => {
      fetchRoles();
      fetchPermissions();
      fetchUserRoles();
    },
  };
};
