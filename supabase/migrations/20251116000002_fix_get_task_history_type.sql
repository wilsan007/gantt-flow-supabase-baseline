-- Corriger le typage de la fonction get_task_history
-- Problème: colonne 8 (user_email) retourne character varying au lieu de text

CREATE OR REPLACE FUNCTION public.get_task_history(p_task_id UUID) 
RETURNS TABLE(
    id UUID, 
    action_type character varying, 
    field_name character varying, 
    old_value text, 
    new_value text, 
    changed_by UUID, 
    changed_at timestamp with time zone, 
    user_email text, 
    metadata jsonb
)
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        th.id,
        th.action_type,
        th.field_name,
        th.old_value,
        th.new_value,
        th.changed_by,
        th.changed_at,
        COALESCE(au.email, 'Système')::text as user_email,  -- Cast explicite en text
        th.metadata
    FROM public.task_history th
    LEFT JOIN auth.users au ON th.changed_by = au.id
    WHERE th.task_id = p_task_id
    AND th.tenant_id = (
        SELECT tenant_id FROM public.profiles 
        WHERE user_id = auth.uid() 
        LIMIT 1
    )
    ORDER BY th.changed_at DESC;
END;
$$;
