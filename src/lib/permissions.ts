/**
 * Système de Permissions et Filtrage - Pattern Enterprise
 * Basé sur les meilleures pratiques : Stripe, Salesforce, Monday.com
 */

import { supabase } from '@/integrations/supabase/client';

export type RoleName =
  | 'super_admin'
  | 'tenant_admin'
  | 'hr_manager'
  | 'project_manager'
  | 'team_lead'
  | 'employee'
  | 'contractor'
  | 'intern'
  | 'viewer';

export type ResourceType =
  | 'tasks'
  | 'projects'
  | 'employees'
  | 'leave_requests'
  | 'expense_reports'
  | 'documents'
  | 'comments';

export interface UserContext {
  userId: string;
  tenantId: string | null;
  roles: RoleName[];
  projectIds: string[]; // Projets dont l'utilisateur est membre
}

export interface FilterResult {
  canViewAll: boolean; // Peut voir toutes les données du tenant
  canViewAssigned: boolean; // Peut voir ce qui lui est assigné
  canViewTeam: boolean; // Peut voir l'équipe/projets
  mustFilterByUser: boolean; // Doit filtrer par user_id
  mustFilterByProjects: boolean; // Doit filtrer par project_id
  allowedProjectIds: string[]; // IDs des projets accessibles
}

/**
 * 🎯 RÈGLE D'OR :
 * - Super Admin → Voit TOUT (cross-tenant)
 * - Tenant Admin → Voit tout SON tenant
 * - HR Manager → Voit tout RH + projets du tenant
 * - Project Manager → Voit ses projets + peut en créer
 * - Team Lead → Voit projets assignés + peut gérer tâches équipe
 * - Employee/Contractor → Voit uniquement tâches assignées
 * - Intern/Viewer → Lecture seule limitée
 */
export function getResourceFilter(resource: ResourceType, userContext: UserContext): FilterResult {
  const { roles, projectIds } = userContext;

  // 🔓 Super Admin : Accès total cross-tenant
  if (roles.includes('super_admin')) {
    return {
      canViewAll: true,
      canViewAssigned: true,
      canViewTeam: true,
      mustFilterByUser: false,
      mustFilterByProjects: false,
      allowedProjectIds: [],
    };
  }

  // 🔓 Tenant Admin : Tout le tenant
  if (roles.includes('tenant_admin')) {
    return {
      canViewAll: true,
      canViewAssigned: true,
      canViewTeam: true,
      mustFilterByUser: false,
      mustFilterByProjects: false,
      allowedProjectIds: [],
    };
  }

  // 🏥 HR Manager : Selon la ressource
  if (roles.includes('hr_manager')) {
    if (['employees', 'leave_requests', 'expense_reports'].includes(resource)) {
      // RH voit tout le tenant pour les ressources RH
      return {
        canViewAll: true,
        canViewAssigned: true,
        canViewTeam: true,
        mustFilterByUser: false,
        mustFilterByProjects: false,
        allowedProjectIds: [],
      };
    }
    // Pour projets/tâches : voit tout le tenant (lecture seule)
    return {
      canViewAll: true,
      canViewAssigned: true,
      canViewTeam: true,
      mustFilterByUser: false,
      mustFilterByProjects: false,
      allowedProjectIds: [],
    };
  }

  // 📊 Project Manager : Ses projets + création
  if (roles.includes('project_manager')) {
    if (resource === 'projects') {
      // Voit tous les projets du tenant (pour créer des liens)
      return {
        canViewAll: true,
        canViewAssigned: true,
        canViewTeam: true,
        mustFilterByUser: false,
        mustFilterByProjects: false,
        allowedProjectIds: [],
      };
    }
    if (resource === 'tasks') {
      // Voit tâches de ses projets + assignées à lui
      return {
        canViewAll: false,
        canViewAssigned: true,
        canViewTeam: true,
        mustFilterByUser: false,
        mustFilterByProjects: true,
        allowedProjectIds: projectIds,
      };
    }
    // Documents/Comments : selon projets
    return {
      canViewAll: false,
      canViewAssigned: true,
      canViewTeam: true,
      mustFilterByUser: false,
      mustFilterByProjects: true,
      allowedProjectIds: projectIds,
    };
  }

  // 👥 Team Lead : Projets assignés + tâches équipe
  if (roles.includes('team_lead')) {
    if (resource === 'projects') {
      // Voit uniquement projets assignés
      return {
        canViewAll: false,
        canViewAssigned: true,
        canViewTeam: true,
        mustFilterByUser: false,
        mustFilterByProjects: true,
        allowedProjectIds: projectIds,
      };
    }
    if (resource === 'tasks') {
      // Voit tâches des projets assignés
      return {
        canViewAll: false,
        canViewAssigned: true,
        canViewTeam: true,
        mustFilterByUser: false,
        mustFilterByProjects: true,
        allowedProjectIds: projectIds,
      };
    }
    return {
      canViewAll: false,
      canViewAssigned: true,
      canViewTeam: false,
      mustFilterByUser: false,
      mustFilterByProjects: true,
      allowedProjectIds: projectIds,
    };
  }

  // 👤 Employee/Contractor : Uniquement assigné
  if (roles.includes('employee') || roles.includes('contractor')) {
    return {
      canViewAll: false,
      canViewAssigned: true,
      canViewTeam: false,
      mustFilterByUser: true, // ⚠️ CRITIQUE : Filtrer par user_id
      mustFilterByProjects: false,
      allowedProjectIds: [],
    };
  }

  // 📖 Intern/Viewer : Lecture seule très limitée
  if (roles.includes('intern') || roles.includes('viewer')) {
    return {
      canViewAll: false,
      canViewAssigned: true,
      canViewTeam: false,
      mustFilterByUser: true, // Uniquement assigné
      mustFilterByProjects: false,
      allowedProjectIds: [],
    };
  }

  // Par défaut : Accès minimal
  return {
    canViewAll: false,
    canViewAssigned: true,
    canViewTeam: false,
    mustFilterByUser: true,
    mustFilterByProjects: false,
    allowedProjectIds: [],
  };
}

/**
 * Récupérer le contexte utilisateur complet
 */
export async function getUserContext(): Promise<UserContext | null> {
  try {
    // 1. Récupérer l'utilisateur
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    // 2. Récupérer les rôles actifs
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select(
        `
        *,
        roles:role_id(name),
        tenants:tenant_id(id)
      `
      )
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (rolesError || !userRoles || userRoles.length === 0) {
      return null;
    }

    // 3. Extraire les noms de rôles
    const roles: RoleName[] = userRoles.map(ur => ur.roles?.name as RoleName).filter(Boolean);

    // 4. Récupérer les projets de l'utilisateur
    const { data: projectMemberships } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', user.id)
      .eq('status', 'active');

    const projectIds = projectMemberships?.map(pm => pm.project_id) || [];

    // 5. Récupérer le tenant_id (premier rôle actif)
    const tenantId = userRoles[0]?.tenant_id || null;

    return {
      userId: user.id,
      tenantId,
      roles,
      projectIds,
    };
  } catch (error) {
    console.error('Erreur getUserContext:', error);
    return null;
  }
}

/**
 * Vérifier si l'utilisateur a une permission spécifique
 */
export function hasPermission(userContext: UserContext, permission: string): boolean {
  const { roles } = userContext;

  // Super Admin et Tenant Admin : toutes les permissions
  if (roles.includes('super_admin') || roles.includes('tenant_admin')) {
    return true;
  }

  // Mapping permissions par rôle (Pattern Salesforce)
  const rolePermissions: Record<string, string[]> = {
    hr_manager: [
      'hr_employees_manage',
      'hr_leave_manage',
      'hr_expense_manage',
      'hr_payroll_manage',
      'projects_view_all',
      'user_roles_assign',
    ],
    project_manager: [
      'projects_create',
      'projects_manage_own',
      'projects_view_all',
      'tasks_create',
      'tasks_manage_project',
      'documents_manage',
    ],
    team_lead: [
      'projects_view_assigned',
      'tasks_create',
      'tasks_view_assigned',
      'tasks_update_assigned',
      'documents_view',
      'comments_add',
    ],
    employee: [
      'tasks_view_assigned',
      'tasks_complete_assigned',
      'documents_upload',
      'documents_view',
      'comments_add',
    ],
    contractor: [
      'tasks_view_assigned',
      'tasks_complete_assigned',
      'documents_upload',
      'documents_view',
    ],
    intern: ['projects_view_assigned', 'tasks_view_assigned', 'documents_view', 'comments_view'],
    viewer: ['projects_view_assigned', 'tasks_view_assigned'],
  };

  // Vérifier si au moins un rôle a la permission
  return roles.some(role => {
    const permissions = rolePermissions[role] || [];
    return permissions.includes(permission);
  });
}

/**
 * Obtenir le rôle le plus élevé de l'utilisateur (hiérarchie)
 */
export function getHighestRole(roles: RoleName[]): RoleName | null {
  const hierarchy: RoleName[] = [
    'super_admin',
    'tenant_admin',
    'hr_manager',
    'project_manager',
    'team_lead',
    'employee',
    'contractor',
    'intern',
    'viewer',
  ];

  for (const role of hierarchy) {
    if (roles.includes(role)) {
      return role;
    }
  }

  return null;
}
