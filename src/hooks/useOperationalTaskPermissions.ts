import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';

/**
 * 🔒 MATRICE DE PERMISSIONS - TÂCHES OPÉRATIONNELLES
 *
 * Les tâches opérationnelles sont des activités récurrentes ou quotidiennes
 * Plus flexibles que les tâches projets, avec permissions différentes
 *
 * ┌─────────────────────┬──────────┬──────────┬───────────┬──────────┬──────────┐
 * │ Rôle                │ Créer    │ Modifier │ Supprimer │ Assigner │ Voir     │
 * ├─────────────────────┼──────────┼──────────┼───────────┼──────────┼──────────┤
 * │ Super Admin         │ ✅ Tout  │ ✅ Tout  │ ✅ Tout   │ ✅ Tout  │ ✅ Tout  │
 * │ Tenant Owner        │ ✅ Tout  │ ✅ Tout  │ ✅ Tout   │ ✅ Tout  │ ✅ Tout  │
 * │ Admin               │ ✅ Tout  │ ✅ Tout  │ ✅ Tout   │ ✅ Tout  │ ✅ Tout  │
 * │ Project Manager     │ ✅ Dépt  │ ✅ Dépt  │ ✅ Dépt   │ ✅ Dépt  │ ✅ Tout  │
 * │ Team Lead           │ ✅ Équipe│ ✅ Équipe│ ✅ Équipe │ ✅ Équipe│ ✅ Équipe│
 * │ Employee/Collab     │ ✅ Soi   │ ✅ Soi   │ ✅ Soi    │ ❌ Non   │ ✅ Soi   │
 * │ Viewer/Intern       │ ❌ Non   │ ❌ Non   │ ❌ Non    │ ❌ Non   │ ✅ Soi   │
 * └─────────────────────┴──────────┴──────────┴───────────┴──────────┴──────────┘
 *
 * Règles spéciales :
 * - Tâches opérationnelles sont plus flexibles (Employee peut supprimer)
 * - Focus sur l'équipe et le département plutôt que projets
 * - Statut modifiable par assignee + créateur + supérieurs
 * - Priorité modifiable par TL+ (Team Lead et supérieurs)
 */

export interface OperationalTaskPermissions {
  // Permissions globales
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canAssign: boolean;
  canView: boolean;
  canComment: boolean;

  // Permissions par champ (pour édition inline)
  canEditTitle: boolean;
  canEditDescription: boolean;
  canEditDates: boolean;
  canEditPriority: boolean;
  canEditStatus: boolean;
  canEditAssignee: boolean;
  canEditDepartment: boolean;
  canEditRecurrence: boolean;
  canEditCategory: boolean;

  // Métadonnées
  reason?: string;
  role?: string;
}

interface OperationalTask {
  id?: string;
  created_by?: string;
  assigned_to?: string | { id: string; full_name: string };
  department?: string;
  status?: string;
  [key: string]: any;
}

interface UseOperationalTaskPermissionsProps {
  task?: OperationalTask | null;
  taskId?: string;
}

export function useOperationalTaskPermissions({
  task,
  taskId,
}: UseOperationalTaskPermissionsProps = {}) {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [permissions, setPermissions] = useState<OperationalTaskPermissions>({
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canAssign: false,
    canView: false,
    canComment: false,
    canEditTitle: false,
    canEditDescription: false,
    canEditDates: false,
    canEditPriority: false,
    canEditStatus: false,
    canEditAssignee: false,
    canEditDepartment: false,
    canEditRecurrence: false,
    canEditCategory: false,
  });

  const userRole = useMemo(() => {
    return (user as any)?.role || 'viewer';
  }, [user]);

  const userDepartment = useMemo(() => {
    return (user as any)?.department || null;
  }, [user]);

  useEffect(() => {
    if (!user) {
      setPermissions({
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canAssign: false,
        canView: false,
        canComment: false,
        canEditTitle: false,
        canEditDescription: false,
        canEditDates: false,
        canEditPriority: false,
        canEditStatus: false,
        canEditAssignee: false,
        canEditDepartment: false,
        canEditRecurrence: false,
        canEditCategory: false,
        reason: 'Non authentifié',
      });
      return;
    }

    const isCreator = task?.created_by === user.id;
    const isAssignee =
      task?.assigned_to === user.id ||
      (typeof task?.assigned_to === 'object' && (task?.assigned_to as any)?.id === user.id);
    const sameDepartment = task?.department === userDepartment;

    // 🔓 Super Admin - Accès total
    if (userRole === 'super_admin') {
      setPermissions({
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canAssign: true,
        canView: true,
        canComment: true,
        canEditTitle: true,
        canEditDescription: true,
        canEditDates: true,
        canEditPriority: true,
        canEditStatus: true,
        canEditAssignee: true,
        canEditDepartment: true,
        canEditRecurrence: true,
        canEditCategory: true,
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
        canAssign: true,
        canView: true,
        canComment: true,
        canEditTitle: true,
        canEditDescription: true,
        canEditDates: true,
        canEditPriority: true,
        canEditStatus: true,
        canEditAssignee: true,
        canEditDepartment: true,
        canEditRecurrence: true,
        canEditCategory: true,
        role: userRole,
      });
      return;
    }

    // 📁 Project Manager - Accès sur son département
    if (userRole === 'project_manager') {
      setPermissions({
        canCreate: true,
        canEdit: sameDepartment || isCreator,
        canDelete: sameDepartment || isCreator,
        canAssign: sameDepartment,
        canView: true,
        canComment: true,
        canEditTitle: sameDepartment || isCreator,
        canEditDescription: sameDepartment || isCreator,
        canEditDates: sameDepartment || isCreator,
        canEditPriority: sameDepartment || isCreator,
        canEditStatus: sameDepartment || isCreator || isAssignee,
        canEditAssignee: sameDepartment,
        canEditDepartment: sameDepartment,
        canEditRecurrence: sameDepartment || isCreator,
        canEditCategory: sameDepartment || isCreator,
        role: 'project_manager',
        reason: !sameDepartment && !isCreator ? "Tâche d'un autre département" : undefined,
      });
      return;
    }

    // 👥 Team Lead - Accès sur son équipe (plus flexible que pour projets)
    if (userRole === 'team_lead') {
      const isTeamTask = true; // TODO: Vérifier si tâche de l'équipe

      setPermissions({
        canCreate: true,
        canEdit: isTeamTask || isCreator || isAssignee,
        canDelete: isTeamTask || isCreator, // TL peut supprimer tâches de l'équipe
        canAssign: isTeamTask,
        canView: true,
        canComment: true,
        canEditTitle: isTeamTask || isCreator,
        canEditDescription: isTeamTask || isCreator || isAssignee,
        canEditDates: isTeamTask || isCreator,
        canEditPriority: isTeamTask, // TL peut changer priorité opérationnelle
        canEditStatus: isTeamTask || isCreator || isAssignee,
        canEditAssignee: isTeamTask,
        canEditDepartment: false, // Seul PM+ peut changer département
        canEditRecurrence: isTeamTask || isCreator,
        canEditCategory: isTeamTask || isCreator,
        role: 'team_lead',
        reason: !isTeamTask && !isCreator && !isAssignee ? 'Pas votre équipe' : undefined,
      });
      return;
    }

    // 👤 Employee / Collaborator - Plus de liberté sur tâches opérationnelles
    if (['employee', 'collaborator'].includes(userRole)) {
      setPermissions({
        canCreate: true,
        canEdit: isCreator || isAssignee,
        canDelete: isCreator, // Employee peut supprimer ses tâches opérationnelles
        canAssign: false,
        canView: isCreator || isAssignee,
        canComment: true,
        canEditTitle: isCreator,
        canEditDescription: isCreator || isAssignee,
        canEditDates: isCreator, // Pas de contrainte stricte sur dates opérationnelles
        canEditPriority: false,
        canEditStatus: isAssignee || isCreator, // Assignee peut changer statut
        canEditAssignee: false,
        canEditDepartment: false,
        canEditRecurrence: isCreator,
        canEditCategory: isCreator,
        role: userRole,
        reason: !isCreator && !isAssignee ? 'Tâche non assignée à vous' : undefined,
      });
      return;
    }

    // 👁️ Viewer / Intern - Lecture seule
    setPermissions({
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canAssign: false,
      canView: isCreator || isAssignee,
      canComment: isCreator || isAssignee, // Peut commenter sur ses tâches
      canEditTitle: false,
      canEditDescription: false,
      canEditDates: false,
      canEditPriority: false,
      canEditStatus: false,
      canEditAssignee: false,
      canEditDepartment: false,
      canEditRecurrence: false,
      canEditCategory: false,
      role: userRole,
      reason: 'Accès en lecture seule',
    });
  }, [user, userRole, userDepartment, task, taskId]);

  return permissions;
}

/**
 * Hook simplifié pour vérifier rapidement si un champ de tâche opérationnelle est éditable
 */
export function useCanEditOperationalTaskField(
  task: OperationalTask | null,
  field: keyof OperationalTaskPermissions
): boolean {
  const permissions = useOperationalTaskPermissions({ task });
  return (permissions[field] as boolean) || false;
}
