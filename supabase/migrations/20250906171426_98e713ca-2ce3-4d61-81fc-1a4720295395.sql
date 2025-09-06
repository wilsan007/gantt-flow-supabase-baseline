-- Corriger les fonctions pour définir explicitement le search_path
CREATE OR REPLACE FUNCTION public.validate_task_actions_weight_sum()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    total_weight INTEGER;
    target_task_id UUID;
BEGIN
    -- Déterminer l'ID de la tâche affectée
    IF TG_OP = 'DELETE' THEN
        target_task_id := OLD.task_id;
    ELSE
        target_task_id := NEW.task_id;
    END IF;
    
    -- Calculer la somme des poids pour cette tâche
    SELECT COALESCE(SUM(weight_percentage), 0) INTO total_weight
    FROM public.task_actions 
    WHERE task_id = target_task_id
    AND (TG_OP != 'DELETE' OR id != OLD.id); -- Exclure l'enregistrement supprimé
    
    -- Ajouter le nouveau poids si c'est un INSERT ou UPDATE
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        total_weight := total_weight + NEW.weight_percentage;
    END IF;
    
    -- Vérifier que la somme ne dépasse pas 100%
    IF total_weight > 100 THEN
        RAISE EXCEPTION 'La somme des pourcentages pour la tâche ne peut pas dépasser 100 pourcent. Somme actuelle: %', total_weight;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Corriger la fonction distribute_equal_weights
CREATE OR REPLACE FUNCTION public.distribute_equal_weights(p_task_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;