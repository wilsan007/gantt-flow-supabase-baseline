-- Corriger le trigger sync_all_task_names pour utiliser profiles au lieu de employees
-- Problème: Le trigger cherche dans employees alors que assignee_id pointe vers profiles

CREATE OR REPLACE FUNCTION public.sync_all_task_names() 
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    -- ✅ Synchroniser le nom de l'assigné depuis PROFILES (pas employees)
    IF NEW.assignee_id IS NOT NULL THEN
        SELECT full_name INTO NEW.assigned_name
        FROM public.profiles
        WHERE id = NEW.assignee_id;
        
        -- Si aucun profil trouvé, utiliser une valeur par défaut
        IF NEW.assigned_name IS NULL THEN
            NEW.assigned_name := 'Utilisateur Inconnu';
        END IF;
    ELSE
        NEW.assigned_name := '';
    END IF;
    
    -- Synchroniser le nom du projet
    IF NEW.project_id IS NOT NULL THEN
        SELECT name INTO NEW.project_name
        FROM public.projects
        WHERE id = NEW.project_id;
        
        IF NEW.project_name IS NULL THEN
            NEW.project_name := 'Projet Inconnu';
        END IF;
    ELSE
        NEW.project_name := 'Aucun Projet';
    END IF;
    
    -- Synchroniser le nom du département
    IF NEW.department_id IS NOT NULL THEN
        SELECT name INTO NEW.department_name
        FROM public.departments
        WHERE id = NEW.department_id;
        
        IF NEW.department_name IS NULL THEN
            NEW.department_name := 'Département Inconnu';
        END IF;
    ELSE
        NEW.department_name := 'Aucun Département';
    END IF;
    
    RETURN NEW;
END;
$$;

-- ============================================================================
-- Mettre à jour toutes les tâches existantes avec les vrais noms
-- ============================================================================

UPDATE public.tasks t
SET assigned_name = COALESCE(p.full_name, '')
FROM public.profiles p
WHERE t.assignee_id = p.id
  AND t.assignee_id IS NOT NULL;

-- Mettre à jour celles sans assignation
UPDATE public.tasks
SET assigned_name = ''
WHERE assignee_id IS NULL;

-- ============================================================================
-- Vérification
-- ============================================================================

DO $$
DECLARE
    unknown_count INTEGER;
    assigned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unknown_count 
    FROM public.tasks 
    WHERE assigned_name = 'Utilisateur Inconnu';
    
    SELECT COUNT(*) INTO assigned_count 
    FROM public.tasks 
    WHERE assignee_id IS NOT NULL;
    
    RAISE NOTICE '✅ Trigger corrigé pour utiliser profiles';
    RAISE NOTICE '📊 Tâches avec nom assigné: %', assigned_count;
    RAISE NOTICE '⚠️  Tâches "Utilisateur Inconnu": %', unknown_count;
END $$;
