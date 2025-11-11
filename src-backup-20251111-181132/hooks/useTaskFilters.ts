/**
 * 🎯 useTaskFilters - Hook de Filtrage Multi-Critères
 * Pattern: Efficient filtering with memoization
 *
 * Fonctionnalités:
 * - Filtrage par statut, priorité, assigné, projet, dates
 * - Recherche textuelle (titre + description)
 * - Memoization pour performance
 * - Support de l'internationalisation des dates
 */

import { useMemo } from 'react';
import { Task } from '@/hooks/optimized';
import { TaskFilters } from '@/components/tasks/AdvancedFilters';

export const useTaskFilters = (tasks: Task[], filters: TaskFilters) => {
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Filtre: Recherche textuelle
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        task =>
          task.title.toLowerCase().includes(searchLower) ||
          (task.description?.toLowerCase().includes(searchLower) ?? false)
      );
    }

    // Filtre: Statut
    if (filters.status.length > 0) {
      result = result.filter(task => filters.status.includes(task.status));
    }

    // Filtre: Priorité
    if (filters.priority.length > 0) {
      result = result.filter(task => filters.priority.includes(task.priority));
    }

    // Filtre: Assigné
    if (filters.assignee.length > 0) {
      result = result.filter(task => {
        // Gérer les différents formats d'assignee
        const assigneeId = typeof task.assignee === 'string' ? task.assignee : task.assignee_id;

        return assigneeId ? filters.assignee.includes(assigneeId) : false;
      });
    }

    // Filtre: Projet
    if (filters.project.length > 0) {
      result = result.filter(task =>
        task.project_id ? filters.project.includes(task.project_id) : false
      );
    }

    // Filtre: Date de début (à partir de)
    if (filters.dateFrom) {
      result = result.filter(task => {
        if (!task.start_date) return false;
        return new Date(task.start_date) >= new Date(filters.dateFrom);
      });
    }

    // Filtre: Date de fin (jusqu'à)
    if (filters.dateTo) {
      result = result.filter(task => {
        if (!task.due_date) return false;
        return new Date(task.due_date) <= new Date(filters.dateTo);
      });
    }

    return result;
  }, [tasks, filters]);

  // Statistiques de filtrage
  const stats = useMemo(
    () => ({
      total: tasks.length,
      filtered: filteredTasks.length,
      removed: tasks.length - filteredTasks.length,
      percentage: tasks.length > 0 ? Math.round((filteredTasks.length / tasks.length) * 100) : 100,
    }),
    [tasks.length, filteredTasks.length]
  );

  return {
    filteredTasks,
    stats,
  };
};
