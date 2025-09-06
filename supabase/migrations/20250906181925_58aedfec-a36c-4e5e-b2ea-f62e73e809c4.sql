-- Corriger le problème de sécurité de la fonction
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
        SELECT COUNT(*) + 1 INTO sibling_count
        FROM public.tasks
        WHERE (parent_id IS NULL OR task_level = 0);
        
        RETURN sibling_count::TEXT;
    END IF;
    
    -- Pour les sous-tâches, obtenir l'ordre du parent
    SELECT display_order INTO parent_order
    FROM public.tasks
    WHERE id = p_parent_id;
    
    -- Compter les sous-tâches existantes du même parent
    SELECT COUNT(*) + 1 INTO sibling_count
    FROM public.tasks
    WHERE parent_id = p_parent_id;
    
    RETURN parent_order || '.' || sibling_count::TEXT;
END;
$$;