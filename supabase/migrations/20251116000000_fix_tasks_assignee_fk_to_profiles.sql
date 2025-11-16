-- Migration pour corriger la Foreign Key de tasks.assignee_id
-- Problème: assignee_id pointe vers employees.id mais on assigne des profiles.id
-- Solution: Pointer vers profiles.id

-- ============================================================================
-- ÉTAPE 0: Désactiver temporairement les triggers de notification
-- ============================================================================

-- Désactiver le trigger qui cause l'erreur recipient_id (ignorer si n'existe pas)
DO $$ 
BEGIN
    ALTER TABLE public.tasks DISABLE TRIGGER task_notification_trigger;
EXCEPTION 
    WHEN undefined_object THEN 
        RAISE NOTICE 'Trigger task_notification_trigger n''existe pas, passage à l''étape suivante';
END $$;

-- ============================================================================
-- ÉTAPE 1: Nettoyer les données orphelines
-- ============================================================================

-- Afficher les tâches avec des assignee_id invalides
DO $$
DECLARE
    orphan_count INTEGER;
    orphan_tasks TEXT;
BEGIN
    SELECT COUNT(*) INTO orphan_count
    FROM public.tasks
    WHERE assignee_id IS NOT NULL 
      AND assignee_id NOT IN (SELECT id FROM public.profiles);
    
    IF orphan_count > 0 THEN
        RAISE NOTICE '⚠️  Nettoyage: % tâches avec assignee_id invalide seront mises à NULL', orphan_count;
        
        -- Afficher les tâches concernées
        SELECT STRING_AGG(title, ', ') INTO orphan_tasks
        FROM public.tasks
        WHERE assignee_id IS NOT NULL 
          AND assignee_id NOT IN (SELECT id FROM public.profiles)
        LIMIT 10;
        
        RAISE NOTICE 'Tâches concernées: %', COALESCE(orphan_tasks, 'aucune');
    ELSE
        RAISE NOTICE '✅ Aucune donnée orpheline trouvée';
    END IF;
END $$;

-- Mettre à NULL les assignee_id qui ne correspondent à aucun profil
UPDATE public.tasks
SET assignee_id = NULL,
    assigned_name = ''
WHERE assignee_id IS NOT NULL 
  AND assignee_id NOT IN (SELECT id FROM public.profiles);

-- ============================================================================
-- ÉTAPE 2: Supprimer l'ancienne contrainte FK
-- ============================================================================

ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS tasks_assignee_id_fkey;

-- ============================================================================
-- ÉTAPE 3: Créer la nouvelle contrainte pointant vers profiles
-- ============================================================================

ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_assignee_id_fkey 
    FOREIGN KEY (assignee_id) 
    REFERENCES public.profiles(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- ============================================================================
-- ÉTAPE 4: Créer un index pour optimiser les recherches
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id 
ON public.tasks(assignee_id) 
WHERE assignee_id IS NOT NULL;

-- ============================================================================
-- ÉTAPE 5: Réactiver les triggers
-- ============================================================================

DO $$ 
BEGIN
    ALTER TABLE public.tasks ENABLE TRIGGER task_notification_trigger;
EXCEPTION 
    WHEN undefined_object THEN 
        RAISE NOTICE 'Trigger task_notification_trigger n''existe pas';
END $$;

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON CONSTRAINT tasks_assignee_id_fkey ON public.tasks IS 
'Référence vers profiles.id (utilisateurs) plutôt que employees.id';

COMMENT ON COLUMN public.tasks.assignee_id IS 
'UUID du profil utilisateur assigné à cette tâche (profiles.id)';

-- ============================================================================
-- VÉRIFICATION FINALE
-- ============================================================================

DO $$
DECLARE
    total_tasks INTEGER;
    assigned_tasks INTEGER;
    unassigned_tasks INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_tasks FROM public.tasks;
    SELECT COUNT(*) INTO assigned_tasks FROM public.tasks WHERE assignee_id IS NOT NULL;
    SELECT COUNT(*) INTO unassigned_tasks FROM public.tasks WHERE assignee_id IS NULL;
    
    RAISE NOTICE '📊 Résumé:';
    RAISE NOTICE '   - Total tâches: %', total_tasks;
    RAISE NOTICE '   - Tâches assignées: %', assigned_tasks;
    RAISE NOTICE '   - Tâches non assignées: %', unassigned_tasks;
END $$;
