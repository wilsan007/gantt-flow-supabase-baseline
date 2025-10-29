/**
 * Hook Projects - Composition Simple
 * Combine useProjectsOptimized + actions CRUD
 * API compatible avec l'ancien hook
 * Max 100 lignes
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useProjectsOptimized, Project, ProjectStats } from './useProjectsOptimized';
import { QueryFilters } from '@/hooks/utils/useQueryBuilder';

export type { Project, ProjectStats, QueryFilters };

export const useProjects = (filters?: QueryFilters) => {
  const { toast } = useToast();
  
  // Lecture des données (avec cache, métriques, etc.)
  const {
    projects,
    stats,
    loading,
    error,
    metrics,
    refresh,
    clearCache,
    isStale
  } = useProjectsOptimized(filters);

  // Actions CRUD
  const createProject = useCallback(async (data: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: project, error } = await supabase
        .from('projects')
        .insert([data])
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Succès", description: "Projet créé" });
      refresh();
      return project as Project;
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
      throw err;
    }
  }, [toast, refresh]);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    try {
      const { data: project, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Succès", description: "Projet mis à jour" });
      refresh();
      return project as Project;
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
      throw err;
    }
  }, [toast, refresh]);

  const deleteProject = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Succès", description: "Projet supprimé" });
      refresh();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
      throw err;
    }
  }, [toast, refresh]);

  return {
    // Données
    projects,
    stats,
    
    // États
    loading,
    error,
    
    // Métriques
    metrics,
    
    // Actions de lecture
    refresh,
    refetch: refresh,
    clearCache,
    isStale,
    
    // Actions CRUD
    createProject,
    updateProject,
    deleteProject
  };
};
