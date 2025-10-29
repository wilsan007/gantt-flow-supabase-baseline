/**
 * Hook pour gérer le tenant de l'utilisateur connecté
 * VERSION SIMPLIFIÉE - Utilise useUserRoles en interne
 * 
 * Cette version simplifie drastiquement le code en s'appuyant sur useUserRoles
 * qui récupère déjà le tenant_id depuis la table user_roles.
 */

import { useUserRoles } from './useUserRoles';

interface Tenant {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  logo_url?: string;
  status?: string;
  subscription_plan?: string;
  max_users?: number;
  max_projects?: number;
}

interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  tenant_id: string;
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
  const { userRoles, isLoading } = useUserRoles();
  
  // Récupérer le tenant_id depuis le premier rôle actif
  const tenantId = userRoles[0]?.tenant_id;
  
  // Créer un objet tenant minimal
  const currentTenant: Tenant | null = tenantId ? {
    id: tenantId,
    name: 'Mon Organisation', // TODO: Récupérer le vrai nom si nécessaire
    status: 'active'
  } : null;
  
  // Créer un userMembership minimal
  const userMembership: TenantMember | null = tenantId && userRoles[0] ? {
    id: userRoles[0].id,
    tenant_id: tenantId,
    user_id: userRoles[0].user_id,
    role: userRoles[0].roles.name,
    status: 'active',
    permissions: {}
  } : null;
  
  // Fonctions utilitaires
  const hasPermission = (permission: string): boolean => {
    // TODO: Implémenter la vérification des permissions si nécessaire
    return true;
  };
  
  const canManage = (resource: string): boolean => {
    // TODO: Implémenter la vérification des droits de gestion si nécessaire
    return userRoles.some(r => ['tenant_admin', 'super_admin'].includes(r.roles.name));
  };
  
  const hasRole = (roleName: string): boolean => {
    return userRoles.some(role => role.roles.name === roleName && role.is_active);
  };
  
  const getActiveRoles = (): string[] => {
    return userRoles.filter(role => role.is_active).map(role => role.roles.name);
  };
  
  const fetchUserTenant = async () => {
    // Fonction vide pour compatibilité - useUserRoles gère déjà le fetch
    return Promise.resolve();
  };
  
  const switchTenant = async (newTenantId: string) => {
    // TODO: Implémenter le changement de tenant si nécessaire
    console.warn('switchTenant not implemented in simplified version');
    return Promise.resolve();
  };
  
  return {
    currentTenant,
    userMembership,
    userRoles,
    loading: isLoading,
    tenantId,
    fetchUserTenant,
    switchTenant,
    hasPermission,
    canManage,
    hasRole,
    getActiveRoles,
    isAdmin: userRoles.some(r => ['tenant_admin', 'super_admin', 'owner'].includes(r.roles.name))
  };
};
