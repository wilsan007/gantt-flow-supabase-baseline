-- Initialiser les poids pour toutes les tâches existantes qui ont weight_percentage = 0
DO $$
DECLARE
    task_record RECORD;
BEGIN
    -- Pour chaque tâche qui a des actions avec weight_percentage = 0
    FOR task_record IN 
        SELECT DISTINCT task_id 
        FROM public.task_actions 
        WHERE weight_percentage = 0
    LOOP
        -- Distribuer équitablement les poids
        PERFORM public.distribute_equal_weights(task_record.task_id);
    END LOOP;
END $$;