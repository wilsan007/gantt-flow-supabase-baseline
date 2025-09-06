-- Ajouter une colonne pour le pourcentage/importance de chaque action
ALTER TABLE public.task_actions 
ADD COLUMN weight_percentage INTEGER NOT NULL DEFAULT 0;

-- Créer un index pour optimiser les requêtes de validation
CREATE INDEX idx_task_actions_task_id_weight ON public.task_actions(task_id, weight_percentage);

-- Fonction pour valider que la somme des poids fait 100% pour chaque tâche
CREATE OR REPLACE FUNCTION public.validate_task_actions_weight_sum()
RETURNS TRIGGER AS $$
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
        RAISE EXCEPTION 'La somme des pourcentages pour la tâche ne peut pas dépasser 100 pour cent. Somme actuelle: %', total_weight;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour valider la somme des poids
CREATE TRIGGER validate_task_actions_weight_trigger
    BEFORE INSERT OR UPDATE OR DELETE ON public.task_actions
    FOR EACH ROW EXECUTE FUNCTION public.validate_task_actions_weight_sum();

-- Mettre à jour la fonction de calcul de progression pour utiliser les poids
CREATE OR REPLACE FUNCTION public.compute_task_progress(p_task_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN SUM(weight_percentage) = 0 THEN 0
    ELSE ROUND(SUM(CASE WHEN is_done = true THEN weight_percentage ELSE 0 END)::NUMERIC)
  END::INTEGER
  FROM public.task_actions
  WHERE task_id = p_task_id;
$function$;

-- Créer une fonction helper pour distribuer équitablement les poids
CREATE OR REPLACE FUNCTION public.distribute_equal_weights(p_task_id uuid)
RETURNS void
LANGUAGE plpgsql
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