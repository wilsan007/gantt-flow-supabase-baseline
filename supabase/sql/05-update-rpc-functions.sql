-- =====================================================
-- MISE À JOUR: Fonctions RPC
-- Correction: Utilisation de redistribute_task_actions_weight
-- =====================================================

-- =====================================================
-- Recréer la fonction clone_operational_actions_to_task
-- avec appel à la répartition automatique des poids
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
  v_action_count integer;
BEGIN
  -- Récupérer le tenant_id de l'activité
  SELECT tenant_id INTO v_tenant_id
  FROM public.operational_activities
  WHERE id = p_activity_id;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'activity_not_found: %', p_activity_id;
  END IF;

  -- Insérer les actions templates dans task_actions
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

  GET DIAGNOSTICS v_action_count = ROW_COUNT;

  -- ✅ Si des actions ont été créées, répartir automatiquement les poids (100% total)
  IF v_action_count > 0 THEN
    -- Utiliser la fonction existante du système
    PERFORM public.redistribute_task_actions_weight(p_task_id);
    
    RAISE NOTICE '✅ % actions clonées et poids répartis pour tâche %', v_action_count, p_task_id;
  ELSE
    RAISE NOTICE '⚠️  Aucune action template trouvée pour activité %', p_activity_id;
  END IF;

END;
$$;

COMMENT ON FUNCTION public.clone_operational_actions_to_task(uuid, uuid) IS
'✅ Clone les templates d''actions d''une activité opérationnelle (récurrente OU ponctuelle) vers une tâche spécifique.
Répartit automatiquement les poids (weight_percentage) pour atteindre 100%.
Utilisée par:
- Edge Function operational-instantiator (tâches récurrentes automatiques)
- RPC instantiate_one_off_activity (tâches ponctuelles manuelles)';

-- =====================================================
-- Vérification: La fonction redistribute_task_actions_weight existe
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'redistribute_task_actions_weight'
  ) THEN
    RAISE WARNING 'La fonction redistribute_task_actions_weight n''existe pas encore. Elle sera créée automatiquement par les triggers.';
  ELSE
    RAISE NOTICE '✅ La fonction redistribute_task_actions_weight existe et est prête à être utilisée.';
  END IF;
END $$;

-- =====================================================
-- Résultat attendu:
-- ✅ Fonction clone_operational_actions_to_task mise à jour
-- ✅ Utilise redistribute_task_actions_weight pour répartir les poids
-- ✅ Fonctionne pour tâches récurrentes ET ponctuelles
-- ✅ Compatible avec le système d'actions existant (task_actions)
-- =====================================================
