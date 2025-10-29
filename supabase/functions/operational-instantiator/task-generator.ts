// =====================================================
// Générateur de Tâches Opérationnelles
// Crée les tâches dans la table tasks avec idempotence
// =====================================================

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getIsoWeek } from './rrule-parser.ts';

interface GenerateTaskOptions {
  tenantId: string;
  activityId: string;
  date: Date;
  titleTemplate: string;
  ownerId: string | null;
  projectId: string | null;
}

interface GenerateTaskResult {
  created: boolean;
  taskId?: string;
  error?: string;
}

/**
 * Génère une tâche opérationnelle pour une date donnée
 * Idempotent: ne crée pas de doublon (grâce à l'index unique)
 */
export async function generateTask(
  supabase: SupabaseClient,
  options: GenerateTaskOptions
): Promise<GenerateTaskResult> {
  const { tenantId, activityId, date, titleTemplate, ownerId, projectId } =
    options;

  const isoDate = date.toISOString().slice(0, 10);

  // =====================================================
  // 1. Générer le titre avec variables
  // =====================================================
  let title = titleTemplate
    .replace('{{isoWeek}}', String(getIsoWeek(date)))
    .replace('{{date}}', isoDate)
    .replace('{{year}}', String(date.getUTCFullYear()))
    .replace('{{month}}', String(date.getUTCMonth() + 1).padStart(2, '0'))
    .replace('{{day}}', String(date.getUTCDate()).padStart(2, '0'));

  // =====================================================
  // 2. Récupérer les informations de l'assigné et du projet
  // =====================================================
  let assignedName = 'Non assigné';
  let projectName = 'Opération hors projet';
  let departmentName = 'Opérationnel';

  // Récupérer le nom de l'assigné
  if (ownerId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', ownerId)
      .single();

    if (profile?.full_name) {
      assignedName = profile.full_name;
    }
  }

  // Récupérer le nom du projet
  if (projectId) {
    const { data: project } = await supabase
      .from('projects')
      .select('name, department_id')
      .eq('id', projectId)
      .single();

    if (project?.name) {
      projectName = project.name;
    }

    // Récupérer le nom du département via le projet
    if (project?.department_id) {
      const { data: department } = await supabase
        .from('departments')
        .select('name')
        .eq('id', project.department_id)
        .single();

      if (department?.name) {
        departmentName = department.name;
      }
    }
  }

  // =====================================================
  // 3. Insérer la tâche (idempotence via index unique)
  // =====================================================
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .insert({
      tenant_id: tenantId,
      activity_id: activityId,
      is_operational: true,
      title,
      start_date: isoDate,
      due_date: isoDate,
      assignee_id: ownerId,
      assigned_name: assignedName,
      project_id: projectId,
      project_name: projectName,
      department_name: departmentName,
      status: 'todo',
      priority: 'medium',
      progress: 0,
      effort_estimate_h: 0,
      effort_spent_h: 0,
    })
    .select('id')
    .single();

  if (taskError) {
    // Conflit = tâche déjà existante (idempotence OK)
    if (
      taskError.message.toLowerCase().includes('duplicate') ||
      taskError.message.toLowerCase().includes('unique constraint') ||
      taskError.code === '23505'
    ) {
      return { created: false };
    }

    // Autre erreur
    console.error(`Erreur insertion tâche:`, taskError);
    return { created: false, error: taskError.message };
  }

  // =====================================================
  // 4. Cloner les actions templates via RPC
  // =====================================================
  const { error: cloneError } = await supabase.rpc(
    'clone_operational_actions_to_task',
    {
      p_activity_id: activityId,
      p_task_id: task.id,
    }
  );

  if (cloneError) {
    console.warn(
      `⚠️  Erreur clonage actions pour tâche ${task.id}:`,
      cloneError.message
    );
    // On continue malgré l'erreur (tâche créée, juste pas d'actions)
  }

  return { created: true, taskId: task.id };
}
