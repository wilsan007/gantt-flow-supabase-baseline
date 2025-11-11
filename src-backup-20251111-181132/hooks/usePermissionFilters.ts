import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const usePermissionFilters = () => {
  const [canViewAllTasks, setCanViewAllTasks] = useState(false);
  const [canViewAllProjects, setCanViewAllProjects] = useState(false);
  const [canViewAllEmployees, setCanViewAllEmployees] = useState(false);
  const [canViewHRData, setCanViewHRData] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Récupérer les rôles de l'utilisateur directement
        const { data: userRoles, error } = await supabase
          .from('user_roles')
          .select(
            `
            *,
            roles:role_id (name, hierarchy_level)
          `
          )
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (error) {
          console.error('Error fetching user roles:', error);
          return;
        }

        // Vérifier si l'utilisateur a un rôle admin
        const hasAdminRole =
          userRoles?.some(role => ['admin', 'tenant_admin', 'owner'].includes(role.roles.name)) ||
          false;

        // Les admins ont accès à tout
        setCanViewAllTasks(hasAdminRole);
        setCanViewAllProjects(hasAdminRole);
        setCanViewAllEmployees(hasAdminRole);
        setCanViewHRData(hasAdminRole);
      } catch (error) {
        console.error('Error checking permissions:', error);
      }
    };

    checkPermissions();
  }, []);

  const filterTasksByPermissions = async (tasks: any[]) => {
    // Si l'utilisateur peut voir toutes les tâches, retourner toutes
    if (canViewAllTasks) return tasks;

    // Sinon, pour l'instant, retourner toutes (à améliorer plus tard)
    return tasks;
  };

  const filterProjectsByPermissions = async (projects: any[]) => {
    // Si l'utilisateur peut voir tous les projets, retourner tous
    if (canViewAllProjects) return projects;

    // Sinon, pour l'instant, retourner tous (à améliorer plus tard)
    return projects;
  };

  const filterEmployeesByPermissions = async (employees: any[]) => {
    // Si l'utilisateur peut voir tous les employés, retourner tous
    if (canViewAllEmployees) return employees;

    // Sinon, pour l'instant, retourner tous (à améliorer plus tard)
    return employees;
  };

  // Fonction de vérification simple basée sur les rôles
  const checkUserPermission = async (resource: string, action: string, context?: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select(
          `
          *,
          roles:role_id (name)
        `
        )
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) return false;

      // Les admins ont toutes les permissions
      return (
        userRoles?.some(role => ['admin', 'tenant_admin', 'owner'].includes(role.roles.name)) ||
        false
      );
    } catch (error) {
      return false;
    }
  };

  const canAccessResource = async (
    resourceType: string,
    resourceId: string,
    action: string = 'read'
  ) => {
    // Pour l'instant, utiliser la même logique que checkUserPermission
    return await checkUserPermission(resourceType, action);
  };

  return {
    canViewAllTasks,
    canViewAllProjects,
    canViewAllEmployees,
    canViewHRData,
    filterTasksByPermissions,
    filterProjectsByPermissions,
    filterEmployeesByPermissions,
    checkUserPermission,
    canAccessResource,
  };
};
