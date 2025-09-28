-- Correction des doublons dans la numérotation des tâches (display_order)
-- Problème : La fonction generate_display_order compte mal les tâches principales

-- 1. D'abord, renuméroter toutes les tâches existantes pour éliminer les doublons
WITH numbered_main_tasks AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) as new_order
  FROM public.tasks 
  WHERE parent_id IS NULL AND task_level = 0
)
UPDATE public.tasks 
SET display_order = numbered_main_tasks.new_order::TEXT
FROM numbered_main_tasks
WHERE public.tasks.id = numbered_main_tasks.id;

-- 2. Renuméroter les sous-tâches en respectant la hiérarchie
WITH RECURSIVE task_hierarchy AS (
  -- Tâches principales (niveau 0)
  SELECT 
    id,
    parent_id,
    task_level,
    display_order,
    display_order as path
  FROM public.tasks 
  WHERE parent_id IS NULL AND task_level = 0
  
  UNION ALL
  
  -- Sous-tâches (récursif)
  SELECT 
    t.id,
    t.parent_id,
    t.task_level,
    t.display_order,
    th.path || '.' || ROW_NUMBER() OVER (
      PARTITION BY t.parent_id 
      ORDER BY t.created_at
    )::TEXT as path
  FROM public.tasks t
  INNER JOIN task_hierarchy th ON t.parent_id = th.id
  WHERE t.task_level > 0
)
UPDATE public.tasks 
SET display_order = task_hierarchy.path
FROM task_hierarchy
WHERE public.tasks.id = task_hierarchy.id AND public.tasks.task_level > 0;

-- 3. Créer une fonction corrigée pour generate_display_order
CREATE OR REPLACE FUNCTION public.generate_display_order(p_parent_id UUID, p_task_level INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    sibling_count INTEGER;
    parent_order TEXT;
BEGIN
    -- Si c'est une tâche de niveau 0 (tâche principale)
    IF p_task_level = 0 OR p_parent_id IS NULL THEN
        -- Compter UNIQUEMENT les tâches principales (parent_id IS NULL)
        SELECT COUNT(*) + 1 INTO sibling_count
        FROM public.tasks
        WHERE parent_id IS NULL;
        
        RETURN sibling_count::TEXT;
    END IF;
    
    -- Pour les sous-tâches, obtenir l'ordre du parent
    SELECT display_order INTO parent_order
    FROM public.tasks
    WHERE id = p_parent_id;
    
    -- Si le parent n'a pas de display_order, utiliser "1" par défaut
    IF parent_order IS NULL OR parent_order = '' THEN
        parent_order := '1';
    END IF;
    
    -- Compter les sous-tâches existantes du même parent
    SELECT COUNT(*) + 1 INTO sibling_count
    FROM public.tasks
    WHERE parent_id = p_parent_id;
    
    RETURN parent_order || '.' || sibling_count::TEXT;
END;
$$;

-- 4. Créer une fonction pour réparer les display_order existants
CREATE OR REPLACE FUNCTION public.repair_display_order()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Renuméroter les tâches principales
    WITH numbered_main_tasks AS (
        SELECT 
            id,
            ROW_NUMBER() OVER (ORDER BY created_at) as new_order
        FROM public.tasks 
        WHERE parent_id IS NULL
    )
    UPDATE public.tasks 
    SET display_order = numbered_main_tasks.new_order::TEXT
    FROM numbered_main_tasks
    WHERE public.tasks.id = numbered_main_tasks.id;
    
    -- Renuméroter les sous-tâches niveau par niveau
    FOR level_num IN 1..10 LOOP -- Maximum 10 niveaux de profondeur
        WITH numbered_subtasks AS (
            SELECT 
                t.id,
                p.display_order || '.' || ROW_NUMBER() OVER (
                    PARTITION BY t.parent_id 
                    ORDER BY t.created_at
                )::TEXT as new_order
            FROM public.tasks t
            INNER JOIN public.tasks p ON t.parent_id = p.id
            WHERE t.task_level = level_num
        )
        UPDATE public.tasks 
        SET display_order = numbered_subtasks.new_order
        FROM numbered_subtasks
        WHERE public.tasks.id = numbered_subtasks.id;
        
        -- Sortir si aucune tâche de ce niveau
        IF NOT FOUND THEN
            EXIT;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Display order repaired successfully';
END;
$$;

-- 5. Exécuter la réparation
SELECT public.repair_display_order();

-- 6. Vérifier le résultat
SELECT 
    id,
    title,
    parent_id,
    task_level,
    display_order,
    created_at
FROM public.tasks 
ORDER BY 
    CASE 
        WHEN display_order ~ '^[0-9]+$' THEN display_order::INTEGER
        ELSE 999999
    END,
    display_order;

-- 7. Créer un trigger pour maintenir l'unicité des display_order
CREATE OR REPLACE FUNCTION public.ensure_unique_display_order()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Vérifier s'il y a des doublons pour les tâches principales
    IF NEW.parent_id IS NULL AND NEW.task_level = 0 THEN
        WHILE EXISTS (
            SELECT 1 FROM public.tasks 
            WHERE display_order = NEW.display_order 
            AND id != NEW.id 
            AND parent_id IS NULL
        ) LOOP
            -- Incrémenter jusqu'à trouver un numéro unique
            NEW.display_order := (NEW.display_order::INTEGER + 1)::TEXT;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS ensure_unique_display_order_trigger ON public.tasks;
CREATE TRIGGER ensure_unique_display_order_trigger
    BEFORE INSERT OR UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_unique_display_order();
