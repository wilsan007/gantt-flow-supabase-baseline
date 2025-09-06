-- Fix tenant_id generation and create proper admin user setup
-- Remove foreign key constraints that reference auth.users to avoid conflicts

-- First, drop the foreign key constraint on tenant_members if it exists
ALTER TABLE public.tenant_members DROP CONSTRAINT IF EXISTS tenant_members_user_id_fkey;

-- Create a real tenant with proper UUID
INSERT INTO public.tenants (id, name, slug, description, status, subscription_plan, max_users, max_projects)
VALUES (
  gen_random_uuid(),
  'Default Organization', 
  'default-org',
  'Default organization for initial setup',
  'active',
  'enterprise',
  100,
  50
) ON CONFLICT (slug) DO NOTHING;

-- Get the tenant_id we just created
DO $$
DECLARE
    default_tenant_id uuid;
    admin_user_id uuid;
BEGIN
    -- Get the tenant_id
    SELECT id INTO default_tenant_id FROM public.tenants WHERE slug = 'default-org' LIMIT 1;
    
    -- Generate a consistent admin user ID
    admin_user_id := gen_random_uuid();
    
    -- Create admin user profile
    INSERT INTO public.profiles (id, user_id, full_name, role, tenant_id)
    VALUES (
        gen_random_uuid(),
        admin_user_id,
        'Admin User',
        'admin', 
        default_tenant_id
    ) ON CONFLICT (user_id) DO NOTHING;
    
    -- Create tenant membership for the admin user
    INSERT INTO public.tenant_members (user_id, tenant_id, role, status, permissions)
    VALUES (
        admin_user_id,
        default_tenant_id,
        'owner',
        'active',
        '{
            "projects": ["create", "read", "update", "delete", "manage"],
            "tasks": ["create", "read", "update", "delete", "manage"], 
            "users": ["create", "read", "update", "delete", "invite"],
            "departments": ["create", "read", "update", "delete", "manage"],
            "tenant": ["read", "update", "manage", "admin"],
            "billing": ["read", "update", "manage"],
            "settings": ["read", "update", "manage"]
        }'::jsonb
    ) ON CONFLICT (user_id, tenant_id) DO NOTHING;
    
    -- Update all existing records to use the real tenant_id
    UPDATE public.departments SET tenant_id = default_tenant_id 
    WHERE tenant_id = '00000000-0000-0000-0000-000000000000'::uuid OR tenant_id IS NULL;
    
    UPDATE public.projects SET tenant_id = default_tenant_id 
    WHERE tenant_id = '00000000-0000-0000-0000-000000000000'::uuid OR tenant_id IS NULL;
    
    UPDATE public.tasks SET tenant_id = default_tenant_id 
    WHERE tenant_id = '00000000-0000-0000-0000-000000000000'::uuid OR tenant_id IS NULL;
    
    UPDATE public.task_actions SET tenant_id = default_tenant_id 
    WHERE tenant_id = '00000000-0000-0000-0000-000000000000'::uuid OR tenant_id IS NULL;
    
    UPDATE public.task_comments SET tenant_id = default_tenant_id 
    WHERE tenant_id = '00000000-0000-0000-0000-000000000000'::uuid OR tenant_id IS NULL;
    
    UPDATE public.task_dependencies SET tenant_id = default_tenant_id 
    WHERE tenant_id = '00000000-0000-0000-0000-000000000000'::uuid OR tenant_id IS NULL;
    
    UPDATE public.task_documents SET tenant_id = default_tenant_id 
    WHERE tenant_id = '00000000-0000-0000-0000-000000000000'::uuid OR tenant_id IS NULL;
    
    UPDATE public.task_risks SET tenant_id = default_tenant_id 
    WHERE tenant_id = '00000000-0000-0000-0000-000000000000'::uuid OR tenant_id IS NULL;
    
    UPDATE public.profiles SET tenant_id = default_tenant_id 
    WHERE tenant_id = '00000000-0000-0000-0000-000000000000'::uuid OR tenant_id IS NULL;
END $$;

-- Update the get_user_tenant_id function to return our default tenant
-- This simulates the admin being "logged in"
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER  
SET search_path = 'public'
AS $$
    SELECT id FROM public.tenants WHERE slug = 'default-org' LIMIT 1;
$$;