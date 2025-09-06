-- Corriger la fonction de validation des pourcentages
CREATE OR REPLACE FUNCTION public.validate_task_actions_weight_sum()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    
    -- Pour INSERT: calculer la somme incluant le nouveau record
    IF TG_OP = 'INSERT' THEN
        SELECT COALESCE(SUM(weight_percentage), 0) + NEW.weight_percentage INTO total_weight
        FROM public.task_actions 
        WHERE task_id = target_task_id;
    
    -- Pour UPDATE: calculer la somme en remplaçant l'ancien par le nouveau
    ELSIF TG_OP = 'UPDATE' THEN
        SELECT COALESCE(SUM(weight_percentage), 0) - OLD.weight_percentage + NEW.weight_percentage INTO total_weight
        FROM public.task_actions 
        WHERE task_id = target_task_id;
    
    -- Pour DELETE: calculer la somme sans l'enregistrement supprimé
    ELSIF TG_OP = 'DELETE' THEN
        SELECT COALESCE(SUM(weight_percentage), 0) INTO total_weight
        FROM public.task_actions 
        WHERE task_id = target_task_id
        AND id != OLD.id;
    END IF;
    
    -- Vérifier que la somme ne dépasse pas 100%
    IF total_weight > 100 THEN
        RAISE EXCEPTION 'La somme des pourcentages pour la tâche ne peut pas dépasser 100%. Somme calculée: %', total_weight;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;