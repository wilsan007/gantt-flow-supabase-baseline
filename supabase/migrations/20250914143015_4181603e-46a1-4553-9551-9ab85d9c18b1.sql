-- Fix 0010_security_definer_view: ensure views run with caller permissions
DO $$
BEGIN
  -- Set SECURITY INVOKER on current_alerts_view if it exists
  IF EXISTS (
    SELECT 1 FROM pg_views
    WHERE schemaname = 'public' AND viewname = 'current_alerts_view'
  ) THEN
    EXECUTE 'ALTER VIEW public.current_alerts_view SET (security_invoker = true)';
  END IF;
END $$;

-- Fix 0011_function_search_path_mutable: lock down search_path for functions missing it
-- These functions previously lacked an explicit search_path; set it to public for safety
DO $$
BEGIN
  -- calculate_working_days(date, date)
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'calculate_working_days'
      AND p.pronargs = 2
  ) THEN
    EXECUTE 'ALTER FUNCTION public.calculate_working_days(date, date) SET search_path = public';
  END IF;
  
  -- calculate_leave_days()
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'calculate_leave_days'
      AND p.pronargs = 0
  ) THEN
    EXECUTE 'ALTER FUNCTION public.calculate_leave_days() SET search_path = public';
  END IF;
  
  -- calculate_absence_days()
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'calculate_absence_days'
      AND p.pronargs = 0
  ) THEN
    EXECUTE 'ALTER FUNCTION public.calculate_absence_days() SET search_path = public';
  END IF;
END $$;