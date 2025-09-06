-- Supprimer les doublons dans task_actions en gardant l'enregistrement le plus ancien
DELETE FROM public.task_actions 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM public.task_actions 
    GROUP BY task_id, title
);