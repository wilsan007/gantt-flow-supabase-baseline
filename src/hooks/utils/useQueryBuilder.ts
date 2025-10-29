/**
 * Hook Query Builder - Pattern Enterprise
 * Construction de requêtes Supabase avec filtrage sécurisé
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface QueryFilters {
  status?: string[];
  priority?: string[];
  search?: string;
  dateRange?: { start: string; end: string };
  projectId?: string;
  assignedTo?: string;
  createdBy?: string;
  parentId?: string;
  includeSubtasks?: boolean; // Inclure les sous-tâches dans les résultats
  onlyMainTasks?: boolean; // Récupérer uniquement les tâches principales
  onlySubtasks?: boolean; // Récupérer uniquement les sous-tâches
}

export const useQueryBuilder = () => {
  const buildTasksQuery = useCallback((
    tenantId: string | null,
    isSuperAdmin: boolean,
    filters?: QueryFilters
  ) => {
    // Inclure les task_actions pour afficher les colonnes d'actions
    // Utiliser la clé étrangère explicite pour éviter l'ambiguïté
    let query = supabase.from('tasks').select('*, task_actions!task_actions_task_id_fkey(*)', { count: 'exact' });

    // Sécurité : Isolation par tenant (sauf Super Admin)
    if (!isSuperAdmin && tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    // Filtres avancés
    if (filters) {
      // Filtre hiérarchique : tâches principales uniquement par défaut
      if (filters.onlyMainTasks) {
        query = query.is('parent_id', null);
      } else if (filters.parentId !== undefined) {
        // Si parentId est spécifié, filtrer par ce parent (ou null pour principales)
        if (filters.parentId === null) {
          query = query.is('parent_id', null);
        } else {
          query = query.eq('parent_id', filters.parentId);
        }
      }
      // Sinon, récupérer toutes les tâches (principales + sous-tâches)

      if (filters.status?.length) {
        query = query.in('status', filters.status);
      }
      if (filters.priority?.length) {
        query = query.in('priority', filters.priority);
      }
      if (filters.projectId) {
        query = query.eq('project_id', filters.projectId);
      }
      if (filters.assignedTo) {
        query = query.eq('assignee_id', filters.assignedTo);
      }
      if (filters.createdBy) {
        query = query.eq('created_by', filters.createdBy);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters.dateRange) {
        query = query
          .gte('start_date', filters.dateRange.start)
          .lte('due_date', filters.dateRange.end);
      }
    }

    // Tri par display_order pour respecter la hiérarchie
    return query.order('display_order', { ascending: true, nullsFirst: false });
  }, []);

  const buildProjectsQuery = useCallback((
    tenantId: string | null,
    isSuperAdmin: boolean,
    filters?: QueryFilters
  ) => {
    let query = supabase.from('projects').select('*', { count: 'exact' });

    // Sécurité : Isolation par tenant
    if (!isSuperAdmin && tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    // Filtres
    if (filters) {
      if (filters.status?.length) {
        query = query.in('status', filters.status);
      }
      if (filters.priority?.length) {
        query = query.in('priority', filters.priority);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters.createdBy) {
        query = query.eq('created_by', filters.createdBy);
      }
      if (filters.dateRange) {
        query = query
          .gte('start_date', filters.dateRange.start)
          .lte('end_date', filters.dateRange.end);
      }
    }

    return query.order('created_at', { ascending: false });
  }, []);

  const getComplexity = useCallback((
    filters?: QueryFilters,
    isSuperAdmin?: boolean
  ): 'simple' | 'medium' | 'complex' => {
    if (filters && Object.keys(filters).length > 2) return 'complex';
    if (isSuperAdmin) return 'medium';
    return 'simple';
  }, []);

  return {
    buildTasksQuery,
    buildProjectsQuery,
    getComplexity
  };
};
