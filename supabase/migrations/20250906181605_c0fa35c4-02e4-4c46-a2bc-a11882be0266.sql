-- Ajouter une colonne pour les sous-tâches dans la table tasks
ALTER TABLE public.tasks 
ADD COLUMN parent_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
ADD COLUMN task_level INTEGER DEFAULT 0,
ADD COLUMN display_order TEXT DEFAULT '';

-- Index pour améliorer les performances des requêtes de sous-tâches
CREATE INDEX idx_tasks_parent_id ON public.tasks(parent_id);
CREATE INDEX idx_tasks_level ON public.tasks(task_level);

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
    IF p_task_level = 0 THEN
        SELECT COUNT(*) + 1 INTO sibling_count
        FROM public.tasks
        WHERE parent_id IS NULL AND task_level = 0;
        
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