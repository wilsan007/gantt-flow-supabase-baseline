-- Fix tenant_id generation and create proper admin user setup

-- First, create a real tenant with proper UUID
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
);

-- Get the tenant_id we just created for use in subsequent operations
-- Create a temporary function to get the tenant_id
CREATE OR REPLACE FUNCTION get_default_tenant_id() 
RETURNS uuid AS $$
  SELECT id FROM public.tenants WHERE slug = 'default-org' LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Create a demo admin user profile (this will represent our logged-in admin)
-- Note: In production, this would be tied to an actual auth.users record
INSERT INTO public.profiles (id, user_id, full_name, role, tenant_id)
VALUES (
  gen_random_uuid(),
  gen_random_uuid(), -- This would normally come from auth.users
  'Admin User',
  'admin',
  get_default_tenant_id()
);

-- Get the user_id we just created
CREATE OR REPLACE FUNCTION get_admin_user_id() 
RETURNS uuid AS $$
  SELECT user_id FROM public.profiles WHERE full_name = 'Admin User' AND tenant_id = get_default_tenant_id() LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Create tenant membership for the admin user
INSERT INTO public.tenant_members (user_id, tenant_id, role, status, permissions)
VALUES (
  get_admin_user_id(),
  get_default_tenant_id(),
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
);

-- Update all existing records to use the real tenant_id
UPDATE public.departments SET tenant_id = get_default_tenant_id() WHERE tenant_id = '00000000-0000-0000-0000-000000000000'::uuid OR tenant_id IS NULL;
UPDATE public.projects SET tenant_id = get_default_tenant_id() WHERE tenant_id = '00000000-0000-0000-0000-000000000000'::uuid OR tenant_id IS NULL;
UPDATE public.tasks SET tenant_id = get_default_tenant_id() WHERE tenant_id = '00000000-0000-0000-0000-000000000000'::uuid OR tenant_id IS NULL;
UPDATE public.task_actions SET tenant_id = get_default_tenant_id() WHERE tenant_id = '00000000-0000-0000-0000-000000000000'::uuid OR tenant_id IS NULL;
UPDATE public.task_comments SET tenant_id = get_default_tenant_id() WHERE tenant_id = '00000000-0000-0000-0000-000000000000'::uuid OR tenant_id IS NULL;
UPDATE public.task_dependencies SET tenant_id = get_default_tenant_id() WHERE tenant_id = '00000000-0000-0000-0000-000000000000'::uuid OR tenant_id IS NULL;
UPDATE public.task_documents SET tenant_id = get_default_tenant_id() WHERE tenant_id = '00000000-0000-0000-0000-000000000000'::uuid OR tenant_id IS NULL;
UPDATE public.task_risks SET tenant_id = get_default_tenant_id() WHERE tenant_id = '00000000-0000-0000-0000-000000000000'::uuid OR tenant_id IS NULL;

-- Update the get_user_tenant_id function to return our default tenant for now
-- This simulates the admin being "logged in"
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  -- For now, return the default tenant ID to simulate admin login
  -- In production, this would check auth.uid() against tenant_members
  SELECT get_default_tenant_id();
$$;

-- Clean up temporary functions (optional, but good practice)
DROP FUNCTION IF EXISTS get_default_tenant_id();
DROP FUNCTION IF EXISTS get_admin_user_id();