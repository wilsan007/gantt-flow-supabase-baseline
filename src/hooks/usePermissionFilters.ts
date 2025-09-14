import { useState, useEffect } from 'react';
import { useRoleManagement } from './useRoleManagement';

export const usePermissionFilters = () => {
  const { checkUserPermission, canAccessResource } = useRoleManagement();
  const [canViewAllTasks, setCanViewAllTasks] = useState(false);
  const [canViewAllProjects, setCanViewAllProjects] = useState(false);
  const [canViewAllEmployees, setCanViewAllEmployees] = useState(false);
  const [canViewHRData, setCanViewHRData] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      const [tasks, projects, employees, hr] = await Promise.all([
        checkUserPermission('tasks', 'read', 'all'),
        checkUserPermission('projects', 'read', 'all'),
        checkUserPermission('employees', 'read', 'all'),
        checkUserPermission('hr', 'read', 'all')
      ]);

      setCanViewAllTasks(tasks);
      setCanViewAllProjects(projects);
      setCanViewAllEmployees(employees);
      setCanViewHRData(hr);
    };

    checkPermissions();
  }, [checkUserPermission]);

  const filterTasksByPermissions = async (tasks: any[]) => {
    if (canViewAllTasks) return tasks;
    
    const filteredTasks = [];
    for (const task of tasks) {
      const hasAccess = await canAccessResource('tasks', task.id, 'read');
      if (hasAccess) {
        filteredTasks.push(task);
      }
    }
    return filteredTasks;
  };

  const filterProjectsByPermissions = async (projects: any[]) => {
    if (canViewAllProjects) return projects;
    
    const filteredProjects = [];
    for (const project of projects) {
      const hasAccess = await canAccessResource('projects', project.id, 'read');
      if (hasAccess) {
        filteredProjects.push(project);
      }
    }
    return filteredProjects;
  };

  const filterEmployeesByPermissions = async (employees: any[]) => {
    if (canViewAllEmployees) return employees;
    
    const filteredEmployees = [];
    for (const employee of employees) {
      const hasAccess = await canAccessResource('employees', employee.user_id, 'read');
      if (hasAccess) {
        filteredEmployees.push(employee);
      }
    }
    return filteredEmployees;
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
    canAccessResource
  };
};