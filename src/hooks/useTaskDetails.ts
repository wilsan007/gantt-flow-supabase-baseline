import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type TaskRow = Database['public']['Tables']['tasks']['Row'];
type ProjectRow = Database['public']['Tables']['projects']['Row'];
type DepartmentRow = Database['public']['Tables']['departments']['Row'];
type TaskCommentRow = Database['public']['Tables']['task_comments']['Row'];
type TaskRiskRow = Database['public']['Tables']['task_risks']['Row'];
type TaskDependencyRow = Database['public']['Tables']['task_dependencies']['Row'];

interface TaskDependency extends TaskDependencyRow {
  depends_on_task_title: string;
}

export const useTaskDetails = (taskId?: string) => {
  const [taskDetails, setTaskDetails] = useState<TaskRow | null>(null);
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [department, setDepartment] = useState<DepartmentRow | null>(null);
  const [subtasks, setSubtasks] = useState<TaskRow[]>([]);
  const [comments, setComments] = useState<TaskCommentRow[]>([]);
  const [risks, setRisks] = useState<TaskRiskRow[]>([]);
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalEffort, setTotalEffort] = useState(0);
  const [participants, setParticipants] = useState<string[]>([]);

  useEffect(() => {
    if (!taskId) {
      setTaskDetails(null);
      setProject(null);
      setDepartment(null);
      setSubtasks([]);
      setComments([]);
      setRisks([]);
      setDependencies([]);
      setTotalEffort(0);
      setParticipants([]);
      return;
    }

    fetchTaskDetails();
  }, [taskId]);

  const fetchTaskDetails = async () => {
    if (!taskId) return;

    try {
      setLoading(true);

      // Récupérer les détails de la tâche
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (taskError) throw taskError;
      setTaskDetails(task);

      // Récupérer le projet si il y en a un
      if (task.project_id) {
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', task.project_id)
          .single();

        if (!projectError && projectData) {
          setProject(projectData);

          // Récupérer le département du projet
          if (projectData.department_id) {
            const { data: deptData, error: deptError } = await supabase
              .from('departments')
              .select('*')
              .eq('id', projectData.department_id)
              .single();

            if (!deptError && deptData) {
              setDepartment(deptData);
            }
          }
        }
      }

      // Récupérer le département de la tâche directement si pas de projet
      if (!task.project_id && task.department_id) {
        const { data: deptData, error: deptError } = await supabase
          .from('departments')
          .select('*')
          .eq('id', task.department_id)
          .single();

        if (!deptError && deptData) {
          setDepartment(deptData);
        }
      }

      // Récupérer les sous-tâches
      const { data: subtasksData, error: subtasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('parent_id', taskId)
        .order('display_order');

      if (!subtasksError && subtasksData) {
        setSubtasks(subtasksData);
      }

      // Récupérer les commentaires récents
      const { data: commentsData, error: commentsError } = await supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!commentsError && commentsData) {
        setComments(commentsData);
      }

      // Récupérer les risques
      const { data: risksData, error: risksError } = await supabase
        .from('task_risks')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (!risksError && risksData) {
        setRisks(risksData);
      }

      // Récupérer les dépendances
      const { data: dependenciesData, error: dependenciesError } = await supabase
        .from('task_dependencies')
        .select(`
          *,
          depends_on_task:tasks!task_dependencies_depends_on_task_id_fkey(title)
        `)
        .eq('task_id', taskId);

      if (!dependenciesError && dependenciesData) {
        const formattedDependencies = dependenciesData.map(dep => ({
          ...dep,
          depends_on_task_title: (dep.depends_on_task as any)?.title || 'Tâche inconnue'
        }));
        setDependencies(formattedDependencies);
      }

      // Calculer l'effort total (tâche + sous-tâches)
      let effort = task.effort_estimate_h || 0;
      if (subtasksData) {
        effort += subtasksData.reduce((sum, subtask) => sum + (subtask.effort_estimate_h || 0), 0);
      }
      setTotalEffort(effort);

      // Récupérer les participants uniques (responsables de la tâche et sous-tâches + propriétaires d'actions)
      const participantSet = new Set<string>();
      
      // Ajouter le responsable principal
      if (task.assignee) {
        participantSet.add(task.assignee);
      }

      // Ajouter les responsables des sous-tâches
      if (subtasksData) {
        subtasksData.forEach(subtask => {
          if (subtask.assignee) {
            participantSet.add(subtask.assignee);
          }
        });
      }

      // Récupérer les propriétaires d'actions
      const { data: actionsData, error: actionsError } = await supabase
        .from('task_actions')
        .select('owner_id')
        .eq('task_id', taskId);

      if (!actionsError && actionsData) {
        actionsData.forEach(action => {
          if (action.owner_id) {
            participantSet.add(action.owner_id);
          }
        });
      }

      setParticipants(Array.from(participantSet));

    } catch (error: any) {
      console.error('Error fetching task details:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    taskDetails,
    project,
    department,
    subtasks,
    comments,
    risks,
    dependencies,
    loading,
    totalEffort,
    participants
  };
};