import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  UserRole,
  UserPermission,
  RoleNames,
  PermissionNames,
  hasRole as checkHasRole,
  hasPermission as checkHasPermission,
  isSuperAdmin as checkIsSuperAdmin,
} from '@/lib/permissionsSystem';
import { roleCacheManager } from '@/lib/roleCache';

/**
 * Hook pour gérer les rôles et permissions de l'utilisateur connecté
 * Utilise la structure : user_roles -> roles -> permissions_roles -> permissions
 */
export const useUserRoles = () => {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserRolesAndPermissions();
  }, []);

  // Fonctions de récupération des données (pour le cache)
  const fetchRolesFromDB = useCallback(async (userId: string) => {
    // console.log('🔍 Fetching roles for user:', userId);

    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select(
        `
        id,
        user_id,
        role_id,
        is_active,
        tenant_id,
        created_at,
        roles!inner(name)
      `
      )
      .eq('user_id', userId)
      .eq('is_active', true);

    // console.log('📊 Roles query result:', { data: rolesData, error: rolesError });

    if (rolesError) {
      // console.error('❌ Error fetching roles:', rolesError);
      if (rolesError.code === '42501') {
        // console.log('ℹ️ Pas d\'accès à user_roles - Aucun rôle assigné');
        return [];
      }
      throw rolesError;
    }

    // console.log('✅ Roles fetched successfully:', rolesData?.length || 0, 'roles');
    return (rolesData || []) as UserRole[];
  }, []);

  const fetchPermissionsFromDB = useCallback(async (roleIds: string[]) => {
    if (roleIds.length === 0) return [];

    const { data: permissionsData, error: permissionsError } = await supabase
      .from('role_permissions')
      .select(
        `
        permissions!inner(name),
        roles!inner(name)
      `
      )
      .in('role_id', roleIds);

    if (permissionsError) {
      if (permissionsError.code === '42501') {
        // console.log('ℹ️ Pas d\'accès à role_permissions - Permissions non disponibles');
        return [];
      }
      throw permissionsError;
    }

    return (permissionsData || []).map((item: any) => ({
      permission_name: item.permissions?.name || '',
      role_name: item.roles?.name || '',
    })) as UserPermission[];
  }, []);

  const fetchUserRolesAndPermissions = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setUserRoles([]);
        setUserPermissions([]);
        setIsLoading(false);
        return;
      }

      // Déterminer le tenant_id (si applicable)
      const tenantId = user.user_metadata?.tenant_id || user.app_metadata?.tenant_id;

      try {
        // Utiliser le cache pour récupérer les rôles
        const roles = await roleCacheManager.getRoles(user.id, tenantId, () =>
          fetchRolesFromDB(user.id)
        );

        // console.log('🎯 Rôles récupérés pour l\'utilisateur:', roles);
        // console.log('📋 Détail du rôle:', roles[0]?.roles?.name || 'Aucun rôle');
        setUserRoles(roles);

        // Utiliser le cache pour récupérer les permissions
        if (roles.length > 0) {
          const roleIds = roles.map(role => role.role_id);
          const permissions = await roleCacheManager.getPermissions(
            user.id,
            tenantId,
            roleIds,
            () => fetchPermissionsFromDB(roleIds)
          );

          setUserPermissions(permissions);
        } else {
          setUserPermissions([]);
        }
      } catch (dbError: any) {
        // Gestion des erreurs avec fallback gracieux
        if (dbError.code === '42501') {
          // console.log('ℹ️ Permission refusée - Mode dégradé activé');
          setUserRoles([]);
          setUserPermissions([]);
        } else {
          // console.error('❌ Erreur lors de la récupération des rôles:', dbError);
          setUserRoles([]);
          setUserPermissions([]);
        }
      }
    } catch (error: any) {
      // console.error('❌ Erreur lors de la récupération des rôles et permissions:', error);
      setUserRoles([]);
      setUserPermissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Vérifier si l'utilisateur a un rôle spécifique
  const hasRole = (roleName: RoleNames): boolean => {
    return checkHasRole(userRoles, roleName);
  };

  // Vérifier si l'utilisateur a une permission spécifique
  const hasPermission = (permissionName: PermissionNames): boolean => {
    return checkHasPermission(userPermissions, permissionName);
  };

  // Vérifier si l'utilisateur est super admin
  const isSuperAdmin = (): boolean => {
    return checkIsSuperAdmin(userRoles);
  };

  // Vérifier si l'utilisateur est admin de tenant
  const isTenantAdmin = (): boolean => {
    return hasRole(RoleNames.TENANT_ADMIN);
  };

  // Vérifier si l'utilisateur est manager HR
  const isHRManager = (): boolean => {
    return hasRole(RoleNames.MANAGER_HR);
  };

  // Vérifier si l'utilisateur est project manager
  const isProjectManager = (): boolean => {
    return hasRole(RoleNames.PROJECT_MANAGER);
  };

  // Obtenir tous les noms de rôles
  const getRoleNames = (): string[] => {
    return userRoles.map(role => role.roles.name);
  };

  // Fonction pour rafraîchir les rôles et permissions (avec invalidation du cache)
  const refreshRoles = async () => {
    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const tenantId = user.user_metadata?.tenant_id || user.app_metadata?.tenant_id;

        // Invalider le cache et forcer le rafraîchissement
        await roleCacheManager.refreshUser(
          user.id,
          tenantId,
          () => fetchRolesFromDB(user.id),
          () => {
            const roleIds = userRoles.map(role => role.role_id);
            return fetchPermissionsFromDB(roleIds);
          }
        );

        // Récupérer les nouvelles données
        await fetchUserRolesAndPermissions();
      }
    } catch (error) {
      // console.error('Erreur lors du rafraîchissement des rôles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Écouter les événements de cache pour la synchronisation
  useEffect(() => {
    const unsubscribe = roleCacheManager.addEventListener((event, data) => {
      if (event === 'user_cache_refreshed' || event === 'cache_updated') {
        // Récupérer les nouvelles données du cache
        fetchUserRolesAndPermissions();
      }
    });

    return unsubscribe;
  }, []);

  return {
    userRoles,
    userPermissions,
    isLoading,
    hasRole,
    hasPermission,
    isSuperAdmin,
    isTenantAdmin,
    isHRManager,
    isProjectManager,
    getRoleNames,
    refreshRoles,

    // Nouvelles fonctions pour la gestion du cache
    invalidateCache: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const tenantId = user.user_metadata?.tenant_id || user.app_metadata?.tenant_id;
        roleCacheManager.invalidateUser(user.id, tenantId);
      }
    },

    getCacheStats: () => roleCacheManager.getStats(),
  };
};
