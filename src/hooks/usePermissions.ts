import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { permissionManager, PermissionContext, PermissionEvaluation } from '@/lib/permissionManager';

/**
 * Hook pour gérer les permissions de manière optimale
 * Utilise le cache intelligent et l'évaluation contextuelle
 */
export const usePermissions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Initialiser l'ID utilisateur
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    
    getCurrentUser();
  }, []);

  /**
   * Vérifier une permission spécifique
   */
  const checkPermission = useCallback(async (
    permission: string,
    context?: Partial<PermissionContext>
  ): Promise<PermissionEvaluation> => {
    if (!currentUserId) {
      return {
        granted: false,
        reason: 'Utilisateur non authentifié',
        appliedRules: [],
        context: { action: 'access', resource: 'general', ...context },
        evaluatedAt: Date.now(),
        userId: ''
      };
    }

    setIsLoading(true);
    try {
      const evaluation = await permissionManager.evaluatePermission(
        currentUserId,
        permission,
        context
      );
      return evaluation;
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  /**
   * Vérifier si l'utilisateur peut effectuer une action sur une ressource
   */
  const canUser = useCallback(async (
    action: string,
    resource: string,
    context?: Partial<PermissionContext>
  ): Promise<boolean> => {
    if (!currentUserId) return false;

    setIsLoading(true);
    try {
      return await permissionManager.canUser(currentUserId, action, resource, context);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  /**
   * Vérifier plusieurs permissions en parallèle
   */
  const checkMultiplePermissions = useCallback(async (
    permissions: Array<{
      permission: string;
      context?: Partial<PermissionContext>;
    }>
  ): Promise<Record<string, PermissionEvaluation>> => {
    if (!currentUserId) return {};

    setIsLoading(true);
    try {
      const evaluations = await Promise.all(
        permissions.map(async ({ permission, context }) => ({
          key: permission,
          evaluation: await permissionManager.evaluatePermission(
            currentUserId,
            permission,
            context
          )
        }))
      );

      return evaluations.reduce((acc, { key, evaluation }) => {
        acc[key] = evaluation;
        return acc;
      }, {} as Record<string, PermissionEvaluation>);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  /**
   * Vérifications rapides pour l'UI (avec cache)
   */
  const can = {
    // Gestion des utilisateurs
    manageUsers: useCallback(() => canUser('manage', 'users'), [canUser]),
    viewUsers: useCallback(() => canUser('view', 'users'), [canUser]),
    createUser: useCallback(() => canUser('create', 'user'), [canUser]),
    editUser: useCallback((userId?: string) => 
      canUser('edit', 'user', { resourceId: userId }), [canUser]),
    deleteUser: useCallback((userId?: string) => 
      canUser('delete', 'user', { resourceId: userId }), [canUser]),

    // Gestion des projets
    manageProjects: useCallback(() => canUser('manage', 'projects'), [canUser]),
    viewProjects: useCallback(() => canUser('view', 'projects'), [canUser]),
    createProject: useCallback(() => canUser('create', 'project'), [canUser]),
    editProject: useCallback((projectId?: string) => 
      canUser('edit', 'project', { resourceId: projectId }), [canUser]),
    deleteProject: useCallback((projectId?: string) => 
      canUser('delete', 'project', { resourceId: projectId }), [canUser]),

    // Gestion des tâches
    manageTasks: useCallback(() => canUser('manage', 'tasks'), [canUser]),
    viewTasks: useCallback(() => canUser('view', 'tasks'), [canUser]),
    createTask: useCallback(() => canUser('create', 'task'), [canUser]),
    editTask: useCallback((taskId?: string) => 
      canUser('edit', 'task', { resourceId: taskId }), [canUser]),
    assignTask: useCallback((taskId?: string) => 
      canUser('assign', 'task', { resourceId: taskId }), [canUser]),

    // Gestion RH
    manageEmployees: useCallback(() => canUser('manage', 'employees'), [canUser]),
    viewReports: useCallback(() => canUser('view', 'reports'), [canUser]),
    manageAbsences: useCallback(() => canUser('manage', 'absences'), [canUser]),
    viewPayroll: useCallback(() => canUser('view', 'payroll'), [canUser]),

    // Administration
    manageRoles: useCallback(() => canUser('manage', 'roles'), [canUser]),
    manageTenants: useCallback(() => canUser('manage', 'tenants'), [canUser]),
    viewSystemLogs: useCallback(() => canUser('view', 'system_logs'), [canUser]),
    accessSuperAdmin: useCallback(() => canUser('access', 'super_admin'), [canUser]),

    // Permissions contextuelles
    editProjectInTenant: useCallback((projectId?: string, tenantId?: string) => 
      canUser('edit', 'project', { resourceId: projectId, tenantId }), [canUser]),
    assignTaskInProject: useCallback((taskId?: string, projectId?: string) => 
      canUser('assign', 'task', { resourceId: taskId, projectId }), [canUser]),
  };

  /**
   * Obtenir les statistiques des permissions
   */
  const getPermissionStats = useCallback(() => {
    return permissionManager.getStats();
  }, []);

  /**
   * Obtenir le log d'audit récent
   */
  const getAuditLog = useCallback((limit?: number) => {
    return permissionManager.getRecentAuditLog(limit);
  }, []);

  /**
   * Invalider le cache des permissions pour l'utilisateur actuel
   */
  const invalidatePermissionCache = useCallback(() => {
    if (currentUserId) {
      permissionManager.invalidateUserEvaluations(currentUserId);
    }
  }, [currentUserId]);

  return {
    // États
    isLoading,
    currentUserId,

    // Fonctions principales
    checkPermission,
    canUser,
    checkMultiplePermissions,

    // Vérifications rapides
    can,

    // Utilitaires
    getPermissionStats,
    getAuditLog,
    invalidatePermissionCache
  };
};

/**
 * Hook pour vérifier une permission spécifique en temps réel
 */
export const usePermission = (
  permission: string,
  context?: Partial<PermissionContext>
) => {
  const [evaluation, setEvaluation] = useState<PermissionEvaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { checkPermission } = usePermissions();

  useEffect(() => {
    const evaluatePermission = async () => {
      setIsLoading(true);
      try {
        const result = await checkPermission(permission, context);
        setEvaluation(result);
      } catch (error) {
        console.error('Erreur lors de l\'évaluation de la permission:', error);
        setEvaluation({
          granted: false,
          reason: 'Erreur d\'évaluation',
          appliedRules: [],
          context: { action: 'access', resource: 'general', ...context },
          evaluatedAt: Date.now(),
          userId: ''
        });
      } finally {
        setIsLoading(false);
      }
    };

    evaluatePermission();
  }, [permission, context, checkPermission]);

  return {
    granted: evaluation?.granted || false,
    evaluation,
    isLoading
  };
};

/**
 * Hook pour vérifier si l'utilisateur peut effectuer une action
 */
export const useCanUser = (
  action: string,
  resource: string,
  context?: Partial<PermissionContext>
) => {
  const [canAccess, setCanAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { canUser } = usePermissions();

  useEffect(() => {
    const checkAccess = async () => {
      setIsLoading(true);
      try {
        const result = await canUser(action, resource, context);
        setCanAccess(result);
      } catch (error) {
        console.error('Erreur lors de la vérification d\'accès:', error);
        setCanAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [action, resource, context, canUser]);

  return {
    canAccess,
    isLoading
  };
};
