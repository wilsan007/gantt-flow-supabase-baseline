/**
 * 🔐 AuthContext - Centralisation de l'authentification
 *
 * Évite les rendus multiples en partageant l'état d'authentification
 * entre tous les composants via un Context Provider unique.
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useUserAuth, UseUserAuthResult } from '@/hooks/useUserAuth';

// Type du context - Hérite de toutes les propriétés de UseUserAuthResult
type AuthContextType = UseUserAuthResult & {
  isAuthenticated: boolean;
};

// Créer le context
const AuthContext = createContext<AuthContextType | null>(null);

// Props du Provider
interface AuthProviderProps {
  children: ReactNode;
  level?: 1 | 2 | 3;
  includeProjectIds?: boolean;
}

/**
 * Provider d'authentification
 *
 * Utilise useUserAuth UNE SEULE FOIS au niveau de l'app
 * et partage l'état avec tous les enfants via Context.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  level = 1,
  includeProjectIds = true,
}) => {
  // ✅ Appel unique de useUserAuth pour toute l'application
  const auth = useUserAuth({ level, includeProjectIds });

  const value: AuthContextType = {
    ...auth,
    isAuthenticated: !!auth.profile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook pour accéder à l'authentification
 *
 * Utiliser ce hook au lieu de useUserAuth() dans les composants
 * pour bénéficier de la centralisation.
 *
 * @example
 * const { profile, isAuthenticated, loading } = useAuth();
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }

  return context;
};

/**
 * Hook de compatibilité pour useUserFilterContext
 *
 * Remplace l'ancien useUserFilterContext() qui appelait useUserAuth
 * par une version qui utilise le context partagé.
 */
export const useAuthFilterContext = () => {
  const auth = useAuth();

  return {
    profile: auth.profile,
    userContext: auth.userContext,
    loading: auth.loading,
    error: auth.error,
  };
};

/**
 * Hook pour vérifier si l'utilisateur est super admin
 */
export const useIsSuperAdmin = (): boolean => {
  const { profile } = useAuth();
  return profile?.isSuperAdmin || false;
};

/**
 * Hook pour obtenir le tenant ID
 */
export const useTenantId = (): string | null => {
  const { profile } = useAuth();
  return profile?.tenantId || null;
};

/**
 * Hook pour vérifier une permission
 */
export const useHasPermission = (permission: string): boolean => {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
};
