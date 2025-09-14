-- Secure current_alerts_view without breaking existing functionality
-- RLS cannot be applied directly to views, so we:
-- 1) Restrict privileges to authenticated users only
-- 2) Ensure the view runs with invoker privileges so underlying table RLS (tenant-scoped) is enforced

-- Make the view use invoker privileges (Postgres 15+)
ALTER VIEW public.current_alerts_view SET (security_invoker = true);

-- Lock down privileges so it's not publicly readable
REVOKE ALL ON public.current_alerts_view FROM PUBLIC;
REVOKE ALL ON public.current_alerts_view FROM anon;
-- Reset any existing grants to avoid privilege leftovers
REVOKE ALL ON public.current_alerts_view FROM authenticated;
-- Allow only authenticated users to SELECT
GRANT SELECT ON public.current_alerts_view TO authenticated;

-- Document the security posture
COMMENT ON VIEW public.current_alerts_view IS 
'Contains sensitive business alert data. Access restricted to authenticated role only. Tenant isolation is enforced by RLS on underlying tables (tenant_id = get_user_tenant_id()).';