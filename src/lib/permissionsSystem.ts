/**
 * ========================================
 * SYSTÈME DE PERMISSIONS - WADASHAQAYN
 * ========================================
 *
 * Documentation complète de la logique des rôles et permissions
 * pour éviter toute confusion future dans le développement.
 */

/**
 * STRUCTURE DE BASE DE DONNÉES
 * ============================
 *
 * 1. TABLE: user_roles
 *    - Relie les utilisateurs aux rôles
 *    - Colonnes principales :
 *      * user_id: UUID (référence vers auth.users)
 *      * role_id: UUID (référence vers roles.id)
 *      * is_active: boolean (rôle actif ou non)
 *      * tenant_id: UUID (contexte tenant)
 *      * assigned_at: timestamp
 *      * expires_at: timestamp (optionnel)
 *
 * 2. TABLE: roles
 *    - Définit les types de rôles possibles
 *    - Colonnes principales :
 *      * id: UUID (clé primaire)
 *      * name: string (nom du rôle)
 *      * description: string
 *    - Exemples de rôles :
 *      * 'super_admin' - Administrateur système
 *      * 'tenant_admin' - Administrateur de tenant
 *      * 'manager_hr' - Manager RH
 *      * 'project_manager' - Chef de projet
 *      * 'employee' - Employé standard
 *
 * 3. TABLE: permissions
 *    - Définit les types de permissions possibles
 *    - Colonnes principales :
 *      * id: UUID (clé primaire)
 *      * name: string (nom de la permission)
 *      * description: string
 *    - Exemples de permissions :
 *      * 'create_tenant' - Créer des tenants
 *      * 'manage_users' - Gérer les utilisateurs
 *      * 'view_reports' - Voir les rapports
 *      * 'manage_projects' - Gérer les projets
 *      * 'manage_tasks' - Gérer les tâches
 *
 * 4. TABLE: role_permissions
 *    - Relie les permissions aux rôles (table de liaison)
 *    - Colonnes principales :
 *      * id: UUID (clé primaire)
 *      * role_id: UUID (référence vers roles.id)
 *      * permission_id: UUID (référence vers permissions.id)
 */

/**
 * LOGIQUE DE VÉRIFICATION
 * ========================
 *
 * Pour vérifier si un utilisateur a un rôle :
 * 1. Récupérer les user_roles actifs pour l'utilisateur
 * 2. Faire une jointure avec la table roles
 * 3. Vérifier si le nom du rôle correspond
 *
 * SQL équivalent :
 * SELECT ur.*, r.name as role_name
 * FROM user_roles ur
 * JOIN roles r ON ur.role_id = r.id
 * WHERE ur.user_id = ? AND ur.is_active = true AND r.name = ?
 */

/**
 * HIÉRARCHIE DES RÔLES
 * =====================
 *
 * 1. super_admin (Niveau le plus élevé)
 *    - Accès à tout le système
 *    - Peut créer des tenants
 *    - Peut gérer tous les utilisateurs
 *    - Visible : Bouton "Super Admin" + "Rôles et Permissions"
 *
 * 2. tenant_admin (Administrateur de tenant)
 *    - Accès complet à son tenant
 *    - Peut gérer les utilisateurs de son tenant
 *    - Peut créer des projets et tâches
 *
 * 3. manager_hr (Manager RH)
 *    - Gestion des employés
 *    - Gestion des absences
 *    - Rapports RH
 *
 * 4. project_manager (Chef de projet)
 *    - Gestion des projets assignés
 *    - Gestion des tâches
 *    - Rapports de projet
 *
 * 5. employee (Employé standard)
 *    - Accès aux tâches assignées
 *    - Gestion de ses propres données
 */

/**
 * EXEMPLES D'UTILISATION DANS LE CODE
 * ====================================
 */

// Types TypeScript pour la cohérence
export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  is_active: boolean;
  tenant_id: string | null;
  context_type?: string | null;
  context_id?: string | null;
  created_at?: string;
  roles: {
    name: string;
    description?: string;
    display_name?: string;
    hierarchy_level?: number;
  };
}

export interface UserPermission {
  permission_name: string;
  role_name: string;
  description?: string;
}

// Énumération des rôles pour éviter les erreurs de frappe
export enum RoleNames {
  SUPER_ADMIN = 'super_admin',
  TENANT_ADMIN = 'tenant_admin',
  MANAGER_HR = 'manager_hr',
  PROJECT_MANAGER = 'project_manager',
  EMPLOYEE = 'employee',
}

// Énumération des permissions communes
export enum PermissionNames {
  CREATE_TENANT = 'create_tenant',
  MANAGE_USERS = 'manage_users',
  VIEW_REPORTS = 'view_reports',
  MANAGE_PROJECTS = 'manage_projects',
  MANAGE_TASKS = 'manage_tasks',
  MANAGE_EMPLOYEES = 'manage_employees',
  VIEW_ANALYTICS = 'view_analytics',
}

/**
 * REQUÊTES SUPABASE TYPES
 * ========================
 */

// Récupérer les rôles d'un utilisateur
export const getUserRolesQuery = (userId: string) => `
  SELECT 
    ur.id,
    ur.user_id,
    ur.role_id,
    ur.is_active,
    ur.tenant_id,
    ur.created_at,
    r.name as role_name,
    r.description as role_description
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = '${userId}' 
    AND ur.is_active = true
`;

// Récupérer les permissions d'un utilisateur
export const getUserPermissionsQuery = (roleIds: string[]) => `
  SELECT DISTINCT
    p.name as permission_name,
    p.description as permission_description,
    r.name as role_name
  FROM role_permissions rp
  JOIN permissions p ON rp.permission_id = p.id
  JOIN roles r ON rp.role_id = r.id
  WHERE rp.role_id IN (${roleIds.map(id => `'${id}'`).join(', ')})
`;

/**
 * FONCTIONS UTILITAIRES
 * ======================
 */

// Vérifier si un utilisateur a un rôle spécifique
export const hasRole = (userRoles: UserRole[], roleName: RoleNames): boolean => {
  return userRoles.some(role => role.roles.name === roleName);
};

// Vérifier si un utilisateur a une permission spécifique
export const hasPermission = (
  userPermissions: UserPermission[],
  permissionName: PermissionNames
): boolean => {
  return userPermissions.some(perm => perm.permission_name === permissionName);
};

// Vérifier si un utilisateur est super admin
export const isSuperAdmin = (userRoles: UserRole[]): boolean => {
  return hasRole(userRoles, RoleNames.SUPER_ADMIN);
};

// Vérifier si un utilisateur peut gérer les utilisateurs
export const canManageUsers = (userPermissions: UserPermission[]): boolean => {
  return hasPermission(userPermissions, PermissionNames.MANAGE_USERS);
};

/**
 * RÈGLES MÉTIER
 * ==============
 *
 * 1. SUPER ADMIN
 *    - Seuls les super_admin voient le bouton "Super Admin"
 *    - Seuls les super_admin voient le bouton "Rôles et Permissions"
 *    - Les super_admin ont accès à toutes les fonctionnalités
 *
 * 2. TENANT ISOLATION
 *    - Chaque utilisateur (sauf super_admin) est limité à son tenant
 *    - Les requêtes doivent filtrer par tenant_id
 *
 * 3. PERMISSIONS CUMULATIVES
 *    - Un utilisateur peut avoir plusieurs rôles
 *    - Les permissions se cumulent entre les rôles
 *
 * 4. RÔLES ACTIFS UNIQUEMENT
 *    - Seuls les rôles avec is_active = true sont pris en compte
 *    - Les rôles peuvent expirer (expires_at)
 */

/**
 * EXEMPLES DE VÉRIFICATIONS DANS LES COMPOSANTS
 * ==============================================
 */

/*
// Dans un composant React
import { useUserRoles } from '@/hooks/useUserRoles';
import { RoleNames, PermissionNames } from '@/lib/permissionsSystem';

const MyComponent = () => {
  const { hasRole, hasPermission, userRoles, userPermissions } = useUserRoles();
  
  // Vérifier un rôle
  const isAdmin = hasRole(RoleNames.SUPER_ADMIN);
  const isTenantAdmin = hasRole(RoleNames.TENANT_ADMIN);
  
  // Vérifier une permission
  const canManage = hasPermission(PermissionNames.MANAGE_USERS);
  
  // Affichage conditionnel
  return (
    <div>
      {isAdmin && <SuperAdminButton />}
      {isTenantAdmin && <TenantAdminPanel />}
      {canManage && <UserManagementSection />}
    </div>
  );
};
*/

/**
 * DÉBOGAGE ET LOGS
 * =================
 *
 * Pour déboguer les problèmes de permissions :
 * 1. Vérifier que l'utilisateur a bien des user_roles actifs
 * 2. Vérifier que les rôles existent dans la table roles
 * 3. Vérifier que les permissions sont bien liées aux rôles
 * 4. Vérifier le tenant_id si applicable
 */

export const debugUserPermissions = async (userId: string) => {
  console.group(`🔍 Debug Permissions pour utilisateur: ${userId}`);

  // Log des rôles
  console.log('1. Rôles utilisateur:', await getUserRolesQuery(userId));

  // Log des permissions
  console.log('2. Permissions utilisateur:', 'Voir requête getUserPermissionsQuery');

  // Log du contexte tenant
  console.log('3. Contexte tenant:', 'Vérifier tenant_id dans user_roles');

  console.groupEnd();
};

/**
 * MIGRATION ET ÉVOLUTION
 * =======================
 *
 * Lors de l'ajout de nouveaux rôles ou permissions :
 * 1. Ajouter dans les enums RoleNames/PermissionNames
 * 2. Créer les entrées en base de données
 * 3. Lier les permissions aux rôles appropriés
 * 4. Mettre à jour les hooks et composants
 * 5. Tester avec différents types d'utilisateurs
 */

export default {
  RoleNames,
  PermissionNames,
  hasRole,
  hasPermission,
  isSuperAdmin,
  canManageUsers,
  debugUserPermissions,
};
