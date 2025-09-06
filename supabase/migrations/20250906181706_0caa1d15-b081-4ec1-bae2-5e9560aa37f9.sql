-- Ajouter les colonnes manquantes pour les sous-tâches
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS task_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS display_order TEXT DEFAULT '';

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_tasks_level ON public.tasks(task_level);
CREATE INDEX IF NOT EXISTS idx_tasks_display_order ON public.tasks(display_order);

-- Mettre à jour les tâches existantes avec des valeurs par défaut
DO $$
DECLARE
    task_record RECORD;
    counter INTEGER := 1;
BEGIN
    FOR task_record IN 
        SELECT id FROM public.tasks 
        WHERE task_level IS NULL OR display_order IS NULL OR display_order = ''
        ORDER BY created_at
    LOOP
        UPDATE public.tasks 
        SET 
            task_level = 0,
            display_order = counter::TEXT
        WHERE id = task_record.id;
        
        counter := counter + 1;
    END LOOP;
END $$;

-- Fonction pour générer l'ordre d'affichage des sous-tâches
CREATE OR REPLACE FUNCTION public.generate_display_order(p_parent_id UUID, p_task_level INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
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