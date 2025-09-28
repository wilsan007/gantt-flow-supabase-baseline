import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: string; // 'planning', 'active', 'completed', 'on_hold'
  start_date?: string;
  end_date?: string;
  completion_date?: string;
  budget?: number;
  priority: string; // 'low', 'medium', 'high', 'urgent'
  created_at: string;
  updated_at: string;
  tenant_id: string;
  department_id?: string;
  manager_id?: string;
  // Nouvelles colonnes
  skills_required?: string[];
  team_members?: Array<{user_id: string; role: string}>;
  progress?: number;
  estimated_hours?: number;
  actual_hours?: number;
  // Champs calculés/joints
  manager_name?: string;
  department_name?: string;
  task_count?: number;
}

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer les projets avec les informations jointes
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select(`
          *,
          departments!projects_department_id_fkey(name),
          profiles!projects_manager_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Enrichir les données avec les informations jointes
      const enrichedProjects = await Promise.all(
        (data || []).map(async (project) => {
          // Compter les tâches du projet
          const { count: taskCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id);

          return {
            ...project,
            task_count: taskCount || 0,
            manager_name: (project as any).profiles?.full_name || 'Non assigné',
            department_name: (project as any).departments?.name || 'Aucun département'
          };
        })
      );

      setProjects(enrichedProjects);
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'tenant_id' | 'progress' | 'manager_name' | 'department_name' | 'task_count'>) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          ...projectData,
          progress: 0,
          estimated_hours: 0,
          actual_hours: 0,
          skills_required: projectData.skills_required || [],
          team_members: projectData.team_members || []
        }])
        .select()
        .single();

      if (error) throw error;

      // Enrichir les données comme dans fetchProjects
      const enrichedProject = {
        ...data,
        task_count: 0,
        manager_name: 'Non assigné', // Sera mis à jour si on joint les données
        department_name: 'Aucun département'
      };

      setProjects(prev => [enrichedProject, ...prev]);
      return enrichedProject;
    } catch (err: any) {
      console.error('Error creating project:', err);
      throw err;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setProjects(prev => prev.map(p => p.id === id ? data : p));
      return data;
    } catch (err: any) {
      console.error('Error updating project:', err);
      throw err;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      console.error('Error deleting project:', err);
      throw err;
    }
  };

  const getProjectProgress = async (projectName: string) => {
    try {
      // Calculer le progrès basé sur les tâches du projet
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('progress, effort_estimate_h')
        .eq('project_name', projectName);

      if (error) throw error;

      if (!tasks || tasks.length === 0) return 0;

      // Calcul pondéré par l'effort estimé
      const totalEffort = tasks.reduce((sum, task) => sum + (task.effort_estimate_h || 1), 0);
      const weightedProgress = tasks.reduce((sum, task) => 
        sum + (task.progress * (task.effort_estimate_h || 1)), 0
      );

      return Math.round(weightedProgress / totalEffort);
    } catch (err: any) {
      console.error('Error calculating project progress:', err);
      return 0;
    }
  };

  const refreshProjectProgress = async (projectName: string) => {
    const progress = await getProjectProgress(projectName);
    
    // Mettre à jour le progrès du projet
    const project = projects.find(p => p.name === projectName);
    if (project) {
      await updateProject(project.id, { progress });
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    refreshProjectProgress,
    refetch: fetchProjects
  };
};
