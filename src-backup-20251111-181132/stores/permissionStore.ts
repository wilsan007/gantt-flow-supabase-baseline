/**
 * Store de Permissions Global - Inspiré des meilleures pratiques
 * Basé sur Zustand (utilisé par Vercel, Linear, Notion)
 *
 * Avantages:
 * - État global partagé
 * - Pas de re-renders inutiles
 * - Performance optimale
 * - Simplicité d'utilisation
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { UserRole, UserPermission } from '@/lib/permissionsSystem';

interface PermissionState {
  // État
  currentUserId: string | null;
  tenantId: string | null;
  userRoles: UserRole[];
  userPermissions: UserPermission[];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Cache des évaluations (inspiré de React Query)
  permissionCache: Map<string, { result: boolean; timestamp: number }>;

  // Actions
  initialize: () => Promise<void>;
  setUser: (userId: string, tenantId: string) => void;
  loadUserPermissions: () => Promise<void>;
  checkPermission: (permission: string, context?: any) => boolean;
  invalidateCache: () => void;
  reset: () => void;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes (comme React Query)

export const usePermissionStore = create<PermissionState>()(
  subscribeWithSelector((set, get) => ({
    // État initial
    currentUserId: null,
    tenantId: null,
    userRoles: [],
    userPermissions: [],
    isLoading: false,
    isInitialized: false,
    error: null,
    permissionCache: new Map(),

    // Initialisation (appelée une seule fois)
    initialize: async () => {
      const state = get();
      if (state.isInitialized) return;

      set({ isLoading: true, error: null });

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          set({ isLoading: false, isInitialized: true });
          return;
        }

        // Récupérer le profil pour obtenir le tenant_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('user_id', user.id)
          .single();

        if (profile?.tenant_id) {
          set({
            currentUserId: user.id,
            tenantId: profile.tenant_id,
            isInitialized: true,
          });

          // Charger les permissions
          await get().loadUserPermissions();
        } else {
          set({
            isLoading: false,
            isInitialized: true,
            error: 'Profil utilisateur incomplet',
          });
        }
      } catch (error) {
        console.error('Erreur initialisation permissions:', error);
        set({
          isLoading: false,
          isInitialized: true,
          error: "Erreur lors de l'initialisation",
        });
      }
    },

    // Définir l'utilisateur
    setUser: (userId: string, tenantId: string) => {
      set({ currentUserId: userId, tenantId });
    },

    // Charger les permissions utilisateur
    loadUserPermissions: async () => {
      const { currentUserId, tenantId } = get();
      if (!currentUserId || !tenantId) return;

      set({ isLoading: true, error: null });

      try {
        // Récupérer les rôles
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select(
            `
            *,
            roles!inner (
              name,
              description
            )
          `
          )
          .eq('user_id', currentUserId)
          .eq('tenant_id', tenantId)
          .eq('is_active', true);

        if (rolesError) throw rolesError;

        // Récupérer les permissions
        const roleIds = roles?.map(role => role.role_id) || [];
        let permissions: UserPermission[] = [];

        if (roleIds.length > 0) {
          const { data: perms, error: permsError } = await supabase
            .from('role_permissions')
            .select(
              `
              permissions!inner (
                name,
                description
              ),
              roles!inner (
                name
              )
            `
            )
            .in('role_id', roleIds);

          if (permsError) throw permsError;

          permissions =
            perms?.map(perm => ({
              permission_name: perm.permissions.name,
              role_name: perm.roles.name,
              description: perm.permissions.description,
            })) || [];
        }

        set({
          userRoles: roles || [],
          userPermissions: permissions,
          isLoading: false,
          error: null,
        });

        // Invalider le cache des permissions
        get().invalidateCache();

        console.log('✅ Permissions chargées:', {
          roles: roles?.length || 0,
          permissions: permissions.length,
        });
      } catch (error: any) {
        console.error('Erreur chargement permissions:', error);
        set({
          isLoading: false,
          error: error.message || 'Erreur lors du chargement des permissions',
        });
      }
    },

    // Vérifier une permission (avec cache)
    checkPermission: (permission: string, context?: any) => {
      const { userRoles, userPermissions, permissionCache } = get();

      // Générer clé de cache
      const cacheKey = `${permission}_${JSON.stringify(context || {})}`;

      // Vérifier le cache
      const cached = permissionCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.result;
      }

      // Évaluer la permission
      let hasPermission = false;

      // 1. Vérifier si super admin
      const isSuperAdmin = userRoles.some(role => role.roles.name === 'super_admin');
      if (isSuperAdmin) {
        hasPermission = true;
      } else {
        // 2. Vérifier les permissions explicites
        hasPermission = userPermissions.some(perm => perm.permission_name === permission);
      }

      // Mettre en cache le résultat
      const newCache = new Map(permissionCache);
      newCache.set(cacheKey, { result: hasPermission, timestamp: Date.now() });
      set({ permissionCache: newCache });

      return hasPermission;
    },

    // Invalider le cache
    invalidateCache: () => {
      set({ permissionCache: new Map() });
    },

    // Reset complet
    reset: () => {
      set({
        currentUserId: null,
        tenantId: null,
        userRoles: [],
        userPermissions: [],
        isLoading: false,
        isInitialized: false,
        error: null,
        permissionCache: new Map(),
      });
    },
  }))
);

// Sélecteurs optimisés (inspiré de Redux Toolkit)
export const usePermissionSelectors = () => {
  const store = usePermissionStore();

  return {
    // États de base
    isLoading: store.isLoading,
    isInitialized: store.isInitialized,
    error: store.error,

    // Permissions rapides
    isSuperAdmin: store.userRoles.some(role => role.roles.name === 'super_admin'),
    isTenantAdmin: store.userRoles.some(role => role.roles.name === 'tenant_admin'),
    isHRManager: store.userRoles.some(role => role.roles.name === 'manager_hr'),
    isProjectManager: store.userRoles.some(role => role.roles.name === 'project_manager'),

    // Fonctions de vérification
    can: {
      manageEmployees: () => store.checkPermission('manage_employees'),
      manageAbsences: () => store.checkPermission('manage_absences'),
      viewReports: () => store.checkPermission('view_reports'),
      viewPayroll: () => store.checkPermission('view_payroll'),
      manageProjects: () => store.checkPermission('manage_projects'),
      manageTasks: () => store.checkPermission('manage_tasks'),
      manageUsers: () => store.checkPermission('manage_users'),
      accessSuperAdmin: () => store.checkPermission('access_super_admin'),
    },

    // Actions
    initialize: store.initialize,
    refresh: store.loadUserPermissions,
    invalidate: store.invalidateCache,
  };
};
