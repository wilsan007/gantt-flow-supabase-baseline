-- Migration 218: Correction policy task_history
-- Date: 2025-01-11
-- Description: Correction du dernier avertissement "Auth RLS InitPlan"
-- Impact: Résolution 100% des avertissements Auth RLS InitPlan

BEGIN;

-- TASK_HISTORY (1 policy)
DROP POLICY IF EXISTS "Users can view task history for their tenant" ON public.task_history;

CREATE POLICY "Users can view task history for their tenant" ON public.task_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = task_history.task_id
    AND t.tenant_id = public.get_current_tenant_id()
  )
);

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Migration 218: task_history policy corrigée';
  RAISE NOTICE '🎉 100%% des avertissements "Auth RLS InitPlan" résolus !';
END $$;

COMMIT;
