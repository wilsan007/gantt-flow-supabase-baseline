-- Migration pour normaliser la relation tasks <-> projects
-- Objectif: Utiliser uniquement project_id (FK) et supprimer la redondance project_name

-- ============================================================================
-- ÉTAPE 1: Migrer les données - Remplir project_id basé sur project_name
-- ============================================================================

-- Pour les tâches qui ont project_name mais pas project_id
UPDATE public.tasks t
SET project_id = p.id
FROM public.projects p
WHERE t.project_name = p.name
  AND t.project_id IS NULL
  AND t.project_name IS NOT NULL;

-- Afficher les tâches qui n'ont pas pu être migrées
DO $$
DECLARE
    orphan_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphan_count
    FROM public.tasks
    WHERE project_name IS NOT NULL 
      AND project_id IS NULL;
    
    IF orphan_count > 0 THEN
        RAISE NOTICE 'Attention: % tâches avec project_name sans project_id correspondant', orphan_count;
        RAISE NOTICE 'Vérifiez les données avec: SELECT id, title, project_name FROM tasks WHERE project_name IS NOT NULL AND project_id IS NULL;';
    ELSE
        RAISE NOTICE 'Migration réussie: Toutes les tâches ont un project_id valide';
    END IF;
END $$;

-- ============================================================================
-- ÉTAPE 2: Maintenir project_name synchronisé avec project_id via TRIGGER
-- ============================================================================

-- S'assurer que project_name existe (si elle a été supprimée)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' 
        AND column_name = 'project_name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.tasks ADD COLUMN project_name TEXT;
    END IF;
END $$;

-- Fonction pour synchroniser project_name depuis project_id
CREATE OR REPLACE FUNCTION public.sync_task_project_name()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Mettre à jour project_name depuis projects.name
    IF NEW.project_id IS NOT NULL THEN
        SELECT name INTO NEW.project_name
        FROM public.projects
        WHERE id = NEW.project_id;
    ELSE
        NEW.project_name := NULL;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Créer le trigger sur INSERT et UPDATE
DROP TRIGGER IF EXISTS sync_task_project_name_trigger ON public.tasks;
CREATE TRIGGER sync_task_project_name_trigger
    BEFORE INSERT OR UPDATE OF project_id
    ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_task_project_name();

-- Synchroniser toutes les tâches existantes
UPDATE public.tasks t
SET project_name = p.name
FROM public.projects p
WHERE t.project_id = p.id;

-- Créer un index pour optimiser les recherches par project_name
CREATE INDEX IF NOT EXISTS idx_tasks_project_name ON public.tasks(project_name);

-- Trigger pour mettre à jour project_name quand le nom du projet change
CREATE OR REPLACE FUNCTION public.update_tasks_project_name_on_project_rename()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Si le nom du projet change, mettre à jour toutes les tâches
    IF OLD.name IS DISTINCT FROM NEW.name THEN
        UPDATE public.tasks
        SET project_name = NEW.name
        WHERE project_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_tasks_on_project_rename ON public.projects;
CREATE TRIGGER update_tasks_on_project_rename
    AFTER UPDATE OF name
    ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_tasks_project_name_on_project_rename();

-- ============================================================================
-- ÉTAPE 3: Mettre à jour la fonction de calcul de progression
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_project_progress(p_project_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_effort DECIMAL := 0;
    completed_effort DECIMAL := 0;
    progress_percentage INTEGER := 0;
BEGIN
    -- Calculer l'effort total et l'effort complété
    -- Utiliser UNIQUEMENT project_id (plus besoin de project_name)
    SELECT 
        COALESCE(SUM(COALESCE(estimated_hours, effort_estimate_h, 0)), 0),
        COALESCE(SUM(COALESCE(estimated_hours, effort_estimate_h, 0) * COALESCE(progress, 0) / 100.0), 0)
    INTO total_effort, completed_effort
    FROM public.tasks 
    WHERE project_id = p_project_id;
    
    -- Calculer le pourcentage
    IF total_effort > 0 THEN
        progress_percentage := ROUND(completed_effort / total_effort * 100);
    END IF;
    
    -- Mettre à jour le projet
    UPDATE public.projects 
    SET 
        progress = progress_percentage,
        estimated_hours = total_effort,
        updated_at = now()
    WHERE id = p_project_id;
    
    RETURN progress_percentage;
END;
$$;

-- ============================================================================
-- ÉTAPE 4: Recalculer la progression pour tous les projets
-- ============================================================================

DO $$
DECLARE
    project_record RECORD;
BEGIN
    FOR project_record IN SELECT id, name FROM public.projects LOOP
        PERFORM public.calculate_project_progress(project_record.id);
        RAISE NOTICE 'Projet "%" recalculé', project_record.name;
    END LOOP;
END $$;

-- ============================================================================
-- ÉTAPE 5: Vérification et affichage des résultats
-- ============================================================================

-- Afficher les résultats pour "Application Mobile"
SELECT 
    p.name as projet,
    p.progress as progression,
    p.estimated_hours as effort_total,
    COUNT(t.id) as nombre_taches,
    STRING_AGG(t.title, ', ' ORDER BY t.title) as taches
FROM public.projects p
LEFT JOIN public.tasks t ON t.project_id = p.id
WHERE p.name = 'Application Mobile'
GROUP BY p.id, p.name, p.progress, p.estimated_hours;

-- Afficher toutes les tâches avec leur project_name généré automatiquement
SELECT 
    t.title as tache,
    t.project_id,
    t.project_name as nom_projet_genere,
    t.estimated_hours as effort,
    t.progress
FROM public.tasks t
WHERE t.project_name = 'Application Mobile'
ORDER BY t.title;

-- ============================================================================
-- COMMENTAIRES FINAUX
-- ============================================================================

COMMENT ON COLUMN public.tasks.project_name IS 
'Colonne synchronisée automatiquement depuis projects.name via triggers. 
Mise à jour automatique lors de INSERT/UPDATE de project_id ou changement de nom du projet.';

COMMENT ON COLUMN public.tasks.project_id IS 
'Clé étrangère vers projects.id. Source unique de vérité pour la relation task-project.';
