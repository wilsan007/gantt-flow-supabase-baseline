-- Corriger le calcul de progression pour inclure les tâches liées par project_name
-- Problème: Certaines tâches utilisent project_id, d'autres project_name

CREATE OR REPLACE FUNCTION public.calculate_project_progress(p_project_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_effort DECIMAL := 0;
    completed_effort DECIMAL := 0;
    progress_percentage INTEGER := 0;
    project_name_value TEXT;
BEGIN
    -- Récupérer le nom du projet
    SELECT name INTO project_name_value
    FROM public.projects
    WHERE id = p_project_id;
    
    -- Calculer l'effort total et l'effort complété
    -- Inclure les tâches liées par project_id OU project_name
    SELECT 
        COALESCE(SUM(COALESCE(estimated_hours, effort_estimate_h, 0)), 0),
        COALESCE(SUM(COALESCE(estimated_hours, effort_estimate_h, 0) * COALESCE(progress, 0) / 100.0), 0)
    INTO total_effort, completed_effort
    FROM public.tasks 
    WHERE project_id = p_project_id 
       OR (project_name = project_name_value AND project_name IS NOT NULL);
    
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

-- Recalculer la progression pour tous les projets
DO $$
DECLARE
    project_record RECORD;
BEGIN
    FOR project_record IN SELECT id FROM public.projects LOOP
        PERFORM public.calculate_project_progress(project_record.id);
    END LOOP;
END $$;

-- Afficher le résultat
SELECT 
    name as projet,
    progress as nouvelle_progression,
    estimated_hours as effort_total
FROM public.projects
WHERE name = 'Application Mobile';
