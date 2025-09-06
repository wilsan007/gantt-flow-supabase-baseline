-- Supprimer les doublons dans task_actions en gardant l'enregistrement le plus ancien (par created_at)
DELETE FROM public.task_actions 
WHERE id NOT IN (
    SELECT DISTINCT ON (task_id, title) id
    FROM public.task_actions 
    ORDER BY task_id, title, created_at ASC
);