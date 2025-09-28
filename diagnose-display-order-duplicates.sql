-- Script de diagnostic pour identifier les problèmes de display_order

-- 1. Identifier les doublons dans les tâches principales
SELECT 
    display_order,
    COUNT(*) as count,
    STRING_AGG(title, ' | ') as titles,
    STRING_AGG(id::TEXT, ' | ') as task_ids
FROM public.tasks 
WHERE parent_id IS NULL AND task_level = 0
GROUP BY display_order
HAVING COUNT(*) > 1
ORDER BY display_order::INTEGER;

-- 2. Identifier les tâches avec display_order NULL ou vide
SELECT 
    id,
    title,
    parent_id,
    task_level,
    display_order,
    created_at
FROM public.tasks 
WHERE display_order IS NULL OR display_order = ''
ORDER BY created_at;

-- 3. Identifier les incohérences dans la hiérarchie
SELECT 
    t.id,
    t.title,
    t.parent_id,
    t.task_level,
    t.display_order,
    p.display_order as parent_display_order,
    CASE 
        WHEN t.parent_id IS NOT NULL AND p.id IS NULL THEN 'Parent manquant'
        WHEN t.task_level = 0 AND t.parent_id IS NOT NULL THEN 'Niveau incohérent'
        WHEN t.task_level > 0 AND t.parent_id IS NULL THEN 'Parent manquant pour sous-tâche'
        WHEN t.display_order NOT LIKE p.display_order || '.%' AND t.parent_id IS NOT NULL THEN 'Display order incohérent'
        ELSE 'OK'
    END as status
FROM public.tasks t
LEFT JOIN public.tasks p ON t.parent_id = p.id
WHERE 
    (t.parent_id IS NOT NULL AND p.id IS NULL) OR
    (t.task_level = 0 AND t.parent_id IS NOT NULL) OR
    (t.task_level > 0 AND t.parent_id IS NULL) OR
    (t.display_order NOT LIKE p.display_order || '.%' AND t.parent_id IS NOT NULL)
ORDER BY t.display_order;

-- 4. Afficher la structure hiérarchique actuelle
WITH RECURSIVE task_tree AS (
    -- Tâches principales
    SELECT 
        id,
        title,
        parent_id,
        task_level,
        display_order,
        title as path,
        0 as depth
    FROM public.tasks 
    WHERE parent_id IS NULL
    
    UNION ALL
    
    -- Sous-tâches
    SELECT 
        t.id,
        t.title,
        t.parent_id,
        t.task_level,
        t.display_order,
        tt.path || ' > ' || t.title as path,
        tt.depth + 1
    FROM public.tasks t
    INNER JOIN task_tree tt ON t.parent_id = tt.id
    WHERE tt.depth < 10 -- Éviter la récursion infinie
)
SELECT 
    REPEAT('  ', depth) || display_order || ' - ' || title as hierarchy,
    task_level,
    id
FROM task_tree
ORDER BY display_order;

-- 5. Statistiques générales
SELECT 
    'Tâches principales' as type,
    COUNT(*) as count
FROM public.tasks 
WHERE parent_id IS NULL
UNION ALL
SELECT 
    'Sous-tâches niveau ' || task_level as type,
    COUNT(*) as count
FROM public.tasks 
WHERE task_level > 0
GROUP BY task_level
UNION ALL
SELECT 
    'Doublons display_order' as type,
    COUNT(*) as count
FROM (
    SELECT display_order
    FROM public.tasks 
    WHERE parent_id IS NULL
    GROUP BY display_order
    HAVING COUNT(*) > 1
) duplicates
ORDER BY type;

-- 6. Vérifier la fonction generate_display_order
SELECT 
    'Test fonction generate_display_order' as test,
    public.generate_display_order(NULL, 0) as result_main_task,
    public.generate_display_order(
        (SELECT id FROM public.tasks WHERE parent_id IS NULL LIMIT 1), 
        1
    ) as result_subtask;
