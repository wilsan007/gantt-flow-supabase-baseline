-- Vérifier et créer la fonction distribute_equal_weights si elle n'existe pas
CREATE OR REPLACE FUNCTION public.distribute_equal_weights(p_task_id UUID)
RETURNS VOID AS $$
DECLARE
    action_count INTEGER;
    base_weight INTEGER;
    remainder INTEGER;
    action_record RECORD;
    current_index INTEGER := 0;
BEGIN
    -- Compter le nombre d'actions pour cette tâche
    SELECT COUNT(*) INTO action_count
    FROM public.task_actions
    WHERE task_id = p_task_id;
    
    IF action_count = 0 THEN
        RETURN;
    END IF;
    
    -- Calculer la répartition
    base_weight := 100 / action_count;
    remainder := 100 - (base_weight * action_count);
    
    -- Mettre à jour chaque action
    FOR action_record IN 
        SELECT id FROM public.task_actions 
        WHERE task_id = p_task_id 
        ORDER BY created_at
    LOOP
        UPDATE public.task_actions 
        SET weight_percentage = base_weight + (CASE WHEN current_index < remainder THEN 1 ELSE 0 END)
        WHERE id = action_record.id;
        
        current_index := current_index + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;