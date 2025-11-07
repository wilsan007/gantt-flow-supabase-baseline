/**
 * 🎯 Roles Context - Pattern Stripe/Linear
 *
 * Provider centralisé pour les rôles et permissions
 * Évite les appels multiples et optimise les re-renders
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useUserRoles } from '@/hooks/useUserRoles';

interface RolesContextValue {
  roles: any[];
  permissions: any[];
  loading: boolean;
  error: string | null;
  currentRole: string;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

const RolesContext = createContext<RolesContextValue | null>(null);

/**
 * Provider - Utilise useUserRoles une seule fois
 */
export const RolesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userRoles, userPermissions, isLoading } = useUserRoles();

  // Mémoriser la valeur du context pour éviter re-renders
  const value = useMemo<RolesContextValue>(() => {
    const currentRole = userRoles[0]?.roles?.name || 'Aucun rôle';

    return {
      roles: userRoles,
      permissions: userPermissions,
      loading: isLoading,
      error: null, // useUserRoles ne retourne pas d'error
      currentRole,

      // Fonction helper pour vérifier permissions
      hasPermission: (permission: string) => {
        return userPermissions.some(
          (p: any) => p.permissions?.name === permission || p.permissions?.code === permission
        );
      },

      // Fonction helper pour vérifier rôles
      hasRole: (role: string) => {
        return userRoles.some(r => r.roles?.name === role);
      },
    };
  }, [userRoles, userPermissions, isLoading]);

  return <RolesContext.Provider value={value}>{children}</RolesContext.Provider>;
};

/**
 * Hook optimisé - Utilise le context au lieu d'appeler useUserRoles
 */
export const useRoles = (): RolesContextValue => {
  const context = useContext(RolesContext);

  if (!context) {
    throw new Error('useRoles must be used within RolesProvider');
  }

  return context;
};

/**
 * Hook de compatibilité - Pour migration progressive
 * Retourne exactement la même API que useUserRoles
 */
export const useRolesCompat = () => {
  const context = useContext(RolesContext);

  // Si dans un RolesProvider, utiliser le context
  if (context) {
    return {
      userRoles: context.roles,
      userPermissions: context.permissions,
      isLoading: context.loading,
      hasRole: context.hasRole,
      hasPermission: context.hasPermission,

      // Fonctions helpers compatibles
      isSuperAdmin: () => context.hasRole('super_admin'),
      isTenantAdmin: () => context.hasRole('tenant_admin'),
      isHRManager: () => context.hasRole('hr_manager'),
      isProjectManager: () => context.hasRole('project_manager'),

      getRoleNames: () => context.roles.map((r: any) => r.roles?.name).filter(Boolean),
      refreshRoles: () => Promise.resolve(), // No-op dans context
      invalidateCache: () => Promise.resolve(),
      getCacheStats: () => ({ hits: 0, misses: 0, size: 0 }),
    };
  }

  // Sinon, fallback sur useUserRoles (pour composants non migrés)
  return useUserRoles();
};
