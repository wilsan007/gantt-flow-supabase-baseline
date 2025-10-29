-- =====================================================
-- Fonctions RPC (Remote Procedure Call)
-- Module: Tâches Récurrentes & Opérations
-- =====================================================

-- =====================================================
-- 1. FONCTION: Cloner les actions templates vers une tâche
-- =====================================================

CREATE OR REPLACE FUNCTION public.clone_operational_actions_to_task(
  p_activity_id uuid,
  p_task_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  -- Récupérer le tenant_id de l'activité
  SELECT tenant_id INTO v_tenant_id
  FROM public.operational_activities
  WHERE id = p_activity_id;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'activity_not_found: %', p_activity_id;
  END IF;

  -- Insérer les actions templates dans task_actions
  -- Structure de task_actions: id, task_id, title, is_done, owner_id, due_date, notes, position, 
  --                           created_at, updated_at, weight_percentage, tenant_id
  INSERT INTO public.task_actions (
    task_id,
    tenant_id,
    title,
    notes,
    position,
    is_done,
    weight_percentage,
    created_at,
    updated_at
  )
  SELECT
    p_task_id,                    -- task_id
    v_tenant_id,                  -- tenant_id
    t.title,                      -- title
    t.description,                -- notes (mapping description → notes)
    t.position,                   -- position
    false,                        -- is_done (toujours false au début)
    0,                            -- weight_percentage (sera calculé après)
    NOW(),                        -- created_at
    NOW()                         -- updated_at
  FROM public.operational_action_templates t
  WHERE t.activity_id = p_activity_id
  ORDER BY t.position;

  -- ✅ Répartir automatiquement les poids (100% total)
  -- Utiliser la fonction existante du système
  PERFORM public.redistribute_task_actions_weight(p_task_id);

END;
$$;

COMMENT ON FUNCTION public.clone_operational_actions_to_task(uuid, uuid) IS
'Clone les templates d''actions d''une activité opérationnelle vers une tâche spécifique. Utilisée lors de la génération des occurrences.';

-- =====================================================
-- 2. FONCTION: Créer une activité ponctuelle (one-off)
-- =====================================================

CREATE OR REPLACE FUNCTION public.instantiate_one_off_activity(
  p_activity_id uuid,
  p_due_date date,
  p_title text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_task_id uuid;
  v_activity record;
BEGIN
  -- Récupérer les informations de l'activité
  SELECT
    tenant_id,
    owner_id,
    project_id,
    task_title_template,
    name,
    description
  INTO v_activity
  FROM public.operational_activities
  WHERE id = p_activity_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'activity_not_found: %', p_activity_id;
  END IF;

  -- Déterminer le titre de la tâche
  DECLARE
    v_final_title text;
  BEGIN
    v_final_title := COALESCE(
      p_title,
      v_activity.task_title_template,
      v_activity.name
    );

    -- Remplacer les variables du template
    v_final_title := REPLACE(v_final_title, '{{date}}', p_due_date::text);
    v_final_title := REPLACE(v_final_title, '{{year}}', EXTRACT(YEAR FROM p_due_date)::text);
    v_final_title := REPLACE(v_final_title, '{{month}}', EXTRACT(MONTH FROM p_due_date)::text);
    v_final_title := REPLACE(v_final_title, '{{day}}', EXTRACT(DAY FROM p_due_date)::text);
  END;

  -- Créer la tâche (structure complète de tasks)
  INSERT INTO public.tasks (
    tenant_id,
    activity_id,
    is_operational,
    title,
    start_date,
    due_date,
    status,
    priority,
    assignee_id,
    assigned_name,
    project_id,
    project_name,
    department_name,
    description,
    progress,
    created_at,
    updated_at
  )
  SELECT
    v_activity.tenant_id,
    p_activity_id,
    true,                                                    -- is_operational
    v_final_title,                                          -- title
    p_due_date,                                             -- start_date
    p_due_date,                                             -- due_date
    'todo',                                                 -- status
    'medium',                                               -- priority (par défaut)
    v_activity.owner_id,                                    -- assignee_id
    COALESCE(p.full_name, 'Non assigné'),                  -- assigned_name
    v_activity.project_id,                                  -- project_id
    COALESCE(proj.name, 'Opération hors projet'),          -- project_name (valeur explicite)
    COALESCE(d.name, 'Opérationnel'),                      -- department_name (valeur explicite)
    v_activity.description,                                 -- description
    0,                                                      -- progress
    NOW(),                                                  -- created_at
    NOW()                                                   -- updated_at
  FROM (VALUES (1)) AS dummy(x)
  LEFT JOIN public.profiles p ON p.user_id = v_activity.owner_id
  LEFT JOIN public.projects proj ON proj.id = v_activity.project_id
  LEFT JOIN public.departments d ON d.id = v_activity.department_id  -- ✅ CORRECTION: department_id au lieu de tenant_id
  RETURNING id INTO v_task_id;

  -- Cloner les actions templates
  PERFORM public.clone_operational_actions_to_task(p_activity_id, v_task_id);

  RETURN v_task_id;
END;
$$;

COMMENT ON FUNCTION public.instantiate_one_off_activity(uuid, date, text) IS
'Crée une tâche ponctuelle (one-off) à partir d''une activité opérationnelle. Génère la tâche immédiatement avec tous les templates d''actions.';

-- =====================================================
-- 3. FONCTION: Pause/Reprise d''une activité
-- =====================================================

CREATE OR REPLACE FUNCTION public.pause_activity(
  p_activity_id uuid,
  p_is_active boolean
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.operational_activities
  SET
    is_active = p_is_active,
    updated_at = NOW()
  WHERE id = p_activity_id;
$$;

COMMENT ON FUNCTION public.pause_activity(uuid, boolean) IS
'Active ou désactive une activité opérationnelle. Quand is_active=false, l''Edge Function ne génère plus d''occurrences futures.';

-- =====================================================
-- 4. FONCTION: Obtenir les statistiques d''une activité
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_activity_statistics(
  p_activity_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_stats json;
BEGIN
  SELECT json_build_object(
    'activity_id', p_activity_id,
    'total_occurrences', COUNT(*),
    'completed_occurrences', COUNT(*) FILTER (WHERE status = 'done'),
    'pending_occurrences', COUNT(*) FILTER (WHERE status IN ('todo', 'doing')),
    'blocked_occurrences', COUNT(*) FILTER (WHERE status = 'blocked'),
    'avg_completion_days', AVG(
      CASE
        WHEN status = 'done' THEN EXTRACT(DAY FROM (updated_at - created_at))
        ELSE NULL
      END
    ),
    'last_occurrence_date', MAX(due_date),
    'next_occurrence_date', MIN(due_date) FILTER (WHERE due_date > CURRENT_DATE)
  )
  INTO v_stats
  FROM public.tasks
  WHERE activity_id = p_activity_id;

  RETURN v_stats;
END;
$$;

COMMENT ON FUNCTION public.get_activity_statistics(uuid) IS
'Retourne les statistiques d''une activité opérationnelle: nombre d''occurrences, taux de complétion, dates, etc.';

-- =====================================================
-- 5. FONCTION: Supprimer une activité et ses occurrences futures
-- =====================================================

CREATE OR REPLACE FUNCTION public.delete_activity_with_future_occurrences(
  p_activity_id uuid,
  p_keep_completed boolean DEFAULT true
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted_count integer;
  v_kept_count integer;
BEGIN
  -- Supprimer les occurrences futures (ou toutes si p_keep_completed=false)
  DELETE FROM public.tasks
  WHERE activity_id = p_activity_id
    AND (
      (p_keep_completed AND status != 'done' AND due_date >= CURRENT_DATE)
      OR (NOT p_keep_completed)
    );

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Compter les occurrences conservées
  SELECT COUNT(*)
  INTO v_kept_count
  FROM public.tasks
  WHERE activity_id = p_activity_id;

  -- Supprimer l'activité elle-même (cascade sur schedules et templates)
  DELETE FROM public.operational_activities
  WHERE id = p_activity_id;

  RETURN json_build_object(
    'deleted_occurrences', v_deleted_count,
    'kept_occurrences', v_kept_count,
    'activity_deleted', true
  );
END;
$$;

COMMENT ON FUNCTION public.delete_activity_with_future_occurrences(uuid, boolean) IS
'Supprime une activité et ses occurrences futures. Option pour conserver les tâches terminées.';

-- =====================================================
-- 6. GRANTS: Permissions pour les rôles
-- =====================================================

-- Permissions pour authenticated (utilisateurs)
GRANT EXECUTE ON FUNCTION public.clone_operational_actions_to_task(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.instantiate_one_off_activity(uuid, date, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pause_activity(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_activity_statistics(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_activity_with_future_occurrences(uuid, boolean) TO authenticated;

-- Permissions pour service_role (Edge Functions)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =====================================================
-- Résultat attendu:
-- ✅ 5 fonctions RPC créées et documentées
-- ✅ clone_operational_actions_to_task: Clone templates → task_actions
-- ✅ instantiate_one_off_activity: Crée tâche ponctuelle immédiatement
-- ✅ pause_activity: Active/désactive une activité
-- ✅ get_activity_statistics: Statistiques d'une activité
-- ✅ delete_activity_with_future_occurrences: Suppression propre
-- ✅ Permissions accordées aux rôles authenticated et service_role
-- =====================================================
