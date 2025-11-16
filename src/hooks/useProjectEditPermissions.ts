import { useState, useEffect, useMemo } from 'react';
import { useRolesCompat as useUserRoles } from '@/contexts/RolesContext';

/**
 * 🔒 MATRICE DE PERMISSIONS - ÉDITION PROJETS
 *
 * Basée sur les best practices de Monday.com, Asana, Jira :
 *
 * ┌─────────────────────┬──────────┬──────────┬───────────┬──────────┬──────────┐
 * │ Rôle                │ Créer    │ Modifier │ Supprimer │ Archiver │ Voir     │
 * ├─────────────────────┼──────────┼──────────┼───────────┼──────────┼──────────┤
 * │ Super Admin         │ ✅ Tout  │ ✅ Tout  │ ✅ Tout   │ ✅ Tout  │ ✅ Tout  │
 * │ Tenant Owner        │ ✅ Tout  │ ✅ Tout  │ ✅ Tout   │ ✅ Tout  │ ✅ Tout  │
 * │ Admin               │ ✅ Tout  │ ✅ Tout  │ ✅ Tout   │ ✅ Tout  │ ✅ Tout  │
 * │ Project Manager     │ ✅ Oui   │ ✅ Ses P │ ✅ Ses P  │ ✅ Ses P │ ✅ Tout  │
 * │ Team Lead           │ ❌ Non   │ ❌ Non   │ ❌ Non    │ ❌ Non   │ ✅ Tout  │
 * │ Employee/Collab     │ ❌ Non   │ ❌ Non   │ ❌ Non    │ ❌ Non   │ ✅ Siens │
 * │ Viewer/Intern       │ ❌ Non   │ ❌ Non   │ ❌ Non    │ ❌ Non   │ ✅ Siens │
 * └─────────────────────┴──────────┴──────────┴───────────┴──────────┴──────────┘
 *
 * Règles spéciales :
 * - Le chef de projet (manager) peut modifier son projet
 * - Le créateur peut modifier son projet même si pas PM
 * - Budget et dates critiques : PM+ uniquement
 * - Archivage : PM+ uniquement
 */

export interface ProjectEditPermissions {
  // Permissions globales
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canArchive: boolean;
  canView: boolean;
  canManageTeam: boolean;

  // Permissions par champ (pour édition inline)
  canEditName: boolean;
  canEditDescription: boolean;
  canEditDates: boolean;
  canEditBudget: boolean;
  canEditStatus: boolean;
  canEditManager: boolean;
  canEditPriority: boolean;
  canEditClient: boolean;

  // Métadonnées
  reason?: string;
  role?: string;
}

interface Project {
  id?: string;
  created_by?: string;
  manager_id?: string;
  manager_name?: string;
  status?: string;
  [key: string]: any;
}

interface UseProjectEditPermissionsProps {
  project?: Project | null;
  projectId?: string;
}

export function useProjectEditPermissions({
  project,
  projectId,
}: UseProjectEditPermissionsProps = {}) {
  const { userRoles, isSuperAdmin } = useUserRoles();

  const [permissions, setPermissions] = useState<ProjectEditPermissions>({
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canArchive: false,
    canView: false,
    canManageTeam: false,
    canEditName: false,
    canEditDescription: false,
    canEditDates: false,
    canEditBudget: false,
    canEditStatus: false,
    canEditManager: false,
    canEditPriority: false,
    canEditClient: false,
  });

  // ✅ Récupérer le vrai rôle depuis user_roles
  const userRole = useMemo(() => {
    if (isSuperAdmin()) return 'super_admin';
    const primaryRole = userRoles[0]?.roles?.name;
    return primaryRole || 'viewer';
  }, [userRoles, isSuperAdmin]);

  useEffect(() => {
    if (userRoles.length === 0) {
      setPermissions({
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canArchive: false,
        canView: false,
        canManageTeam: false,
        canEditName: false,
        canEditDescription: false,
        canEditDates: false,
        canEditBudget: false,
        canEditStatus: false,
        canEditManager: false,
        canEditPriority: false,
        canEditClient: false,
        reason: 'Non authentifié',
      });
      return;
    }

    // ✅ Récupérer user_id depuis userRoles
    const userId = userRoles[0]?.user_id;
    const isCreator = project?.created_by === userId;
    const isManager =
      project?.manager_id === userId ||
      (typeof project?.manager_name === 'object' && (project?.manager_name as any)?.id === userId);

    // 🔓 Super Admin - Accès total
    if (userRole === 'super_admin') {
      setPermissions({
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canArchive: true,
        canView: true,
        canManageTeam: true,
        canEditName: true,
        canEditDescription: true,
        canEditDates: true,
        canEditBudget: true,
        canEditStatus: true,
        canEditManager: true,
        canEditPriority: true,
        canEditClient: true,
        role: 'super_admin',
      });
      return;
    }

    // 🔓 Tenant Owner / Admin - Accès total au tenant
    if (['tenant_owner', 'admin', 'tenant_admin'].includes(userRole)) {
      setPermissions({
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canArchive: true,
        canView: true,
        canManageTeam: true,
        canEditName: true,
        canEditDescription: true,
        canEditDates: true,
        canEditBudget: true,
        canEditStatus: true,
        canEditManager: true,
        canEditPriority: true,
        canEditClient: true,
        role: userRole,
      });
      return;
    }

    // 📁 Project Manager - Peut créer et gérer ses projets
    if (userRole === 'project_manager') {
      const canManageThisProject = isManager || isCreator;

      setPermissions({
        canCreate: true,
        canEdit: canManageThisProject,
        canDelete: canManageThisProject,
        canArchive: canManageThisProject,
        canView: true,
        canManageTeam: canManageThisProject,
        canEditName: canManageThisProject,
        canEditDescription: canManageThisProject,
        canEditDates: canManageThisProject,
        canEditBudget: canManageThisProject,
        canEditStatus: canManageThisProject,
        canEditManager: canManageThisProject, // ✅ PM peut assigner sur ses projets
        canEditPriority: canManageThisProject,
        canEditClient: canManageThisProject,
        role: 'project_manager',
        reason: !canManageThisProject ? "Vous n'êtes pas le chef de ce projet" : undefined,
      });
      return;
    }

    // 👥 Team Lead - Lecture seule sur les projets
    if (userRole === 'team_lead') {
      setPermissions({
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canArchive: false,
        canView: true,
        canManageTeam: false,
        canEditName: false,
        canEditDescription: false,
        canEditDates: false,
        canEditBudget: false,
        canEditStatus: false,
        canEditManager: false,
        canEditPriority: false,
        canEditClient: false,
        role: 'team_lead',
        reason: 'Les Team Leads ne peuvent pas modifier les projets',
      });
      return;
    }

    // 👤 Employee / Collaborator - Voir seulement ses projets
    if (['employee', 'collaborator'].includes(userRole)) {
      const isMember = true; // TODO: Vérifier si membre du projet

      setPermissions({
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canArchive: false,
        canView: isMember,
        canManageTeam: false,
        canEditName: false,
        canEditDescription: false,
        canEditDates: false,
        canEditBudget: false,
        canEditStatus: false,
        canEditManager: false,
        canEditPriority: false,
        canEditClient: false,
        role: userRole,
        reason: 'Seuls les chefs de projet peuvent modifier les projets',
      });
      return;
    }

    // 👁️ Viewer / Intern - Lecture seule limitée
    setPermissions({
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canArchive: false,
      canView: true, // Tout le monde peut voir
      canManageTeam: false,
      canEditName: false,
      canEditDescription: false,
      canEditDates: false,
      canEditBudget: false,
      canEditStatus: false,
      canEditManager: false,
      canEditPriority: false,
      canEditClient: false,
      role: userRole,
      reason: 'Permissions insuffisantes',
    });
  }, [userRoles, userRole, project, projectId]);

  return permissions;
}

/**
 * Hook simplifié pour vérifier rapidement si un champ de projet est éditable
 */
export function useCanEditProjectField(
  project: Project | null,
  field: keyof ProjectEditPermissions
): boolean {
  const permissions = useProjectEditPermissions({ project });
  return (permissions[field] as boolean) || false;
}
