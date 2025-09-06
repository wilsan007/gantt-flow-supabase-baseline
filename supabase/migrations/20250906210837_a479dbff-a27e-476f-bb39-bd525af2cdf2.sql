-- Update tenant_id for task_actions and profiles, and fix user_id in profiles
-- Target tenant: 878c5ac9-4e99-4baf-803a-14f8ac964ec4

DO $$
DECLARE
    target_tenant_id uuid := '878c5ac9-4e99-4baf-803a-14f8ac964ec4';
BEGIN
    -- Update task_actions tenant_id
    UPDATE public.task_actions 
    SET tenant_id = target_tenant_id 
    WHERE tenant_id != target_tenant_id OR tenant_id IS NULL;
    
    -- Update profiles tenant_id and fix user_id to match id
    UPDATE public.profiles 
    SET 
        tenant_id = target_tenant_id,
        user_id = id  -- Set user_id to be the same as the profile id
    WHERE tenant_id != target_tenant_id OR tenant_id IS NULL OR user_id != id OR user_id IS NULL;
    
    -- Log the updates
    RAISE NOTICE 'Updated task_actions and profiles with tenant_id: %', target_tenant_id;
END $$;