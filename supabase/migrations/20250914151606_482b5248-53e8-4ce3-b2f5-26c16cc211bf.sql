-- Tighten RLS and privileges to resolve remaining security advisor errors

-- 0) Drop the security_status view entirely to avoid exposing config
DROP VIEW IF EXISTS public.security_status;

-- 1) Employees - drop all policies and recreate minimal strict set
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='employees';
  IF FOUND THEN
    -- Drop all existing policies on employees
    FOR policy IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='employees' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.employees;', policy);
    END LOOP;
  END IF;
END $$;

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employees_select_strict"
ON public.employees FOR SELECT TO authenticated
USING (tenant_id = public.get_user_tenant_id() AND (public.is_tenant_admin() OR user_id = auth.uid()));

CREATE POLICY "employees_write_admin"
ON public.employees FOR ALL TO authenticated
USING (tenant_id = public.get_user_tenant_id() AND public.is_tenant_admin());

REVOKE ALL ON public.employees FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;

-- 2) Candidates - strict HR/admin only
DO $$ BEGIN
  FOR policy IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='candidates' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.candidates;', policy);
  END LOOP;
END $$;

ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "candidates_admin_all"
ON public.candidates FOR ALL TO authenticated
USING (tenant_id = public.get_user_tenant_id() AND public.is_tenant_admin());

REVOKE ALL ON public.candidates FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidates TO authenticated;

-- 3) Payrolls - strict view and manage by admin only, plus self-view if needed
DO $$ BEGIN
  FOR policy IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='employee_payrolls' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.employee_payrolls;', policy);
  END LOOP;
END $$;

ALTER TABLE public.employee_payrolls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payrolls_select_admin"
ON public.employee_payrolls FOR SELECT TO authenticated
USING (tenant_id = public.get_user_tenant_id() AND public.is_tenant_admin());

CREATE POLICY "payrolls_write_admin"
ON public.employee_payrolls FOR ALL TO authenticated
USING (tenant_id = public.get_user_tenant_id() AND public.is_tenant_admin());

-- Optional: self-view via join on employees
CREATE POLICY "payrolls_select_self"
ON public.employee_payrolls FOR SELECT TO authenticated
USING (
  tenant_id = public.get_user_tenant_id()
  AND employee_id IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid() AND tenant_id = public.get_user_tenant_id()
  )
);

REVOKE ALL ON public.employee_payrolls FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_payrolls TO authenticated;

-- 4) Profiles - restrict to self or admin only
DO $$ BEGIN
  FOR policy IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='profiles' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles;', policy);
  END LOOP;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_strict"
ON public.profiles FOR SELECT TO authenticated
USING (tenant_id = public.get_user_tenant_id() AND (public.is_tenant_admin() OR user_id = auth.uid()));

CREATE POLICY "profiles_write_self"
ON public.profiles FOR ALL TO authenticated
USING (tenant_id = public.get_user_tenant_id() AND user_id = auth.uid());

CREATE POLICY "profiles_write_admin"
ON public.profiles FOR ALL TO authenticated
USING (tenant_id = public.get_user_tenant_id() AND public.is_tenant_admin());

REVOKE ALL ON public.profiles FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- 5) Alert tables - ensure policies are not granted to PUBLIC
-- Drop and recreate with TO authenticated
DO $$ BEGIN
  FOR t IN SELECT unnest(ARRAY['alert_instances','alert_types','alert_solutions','alert_type_solutions','alert_instance_recommendations']) AS t LOOP
    FOR policy IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t.t LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', policy, t.t);
    END LOOP;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t.t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL) AND (tenant_id = public.get_user_tenant_id()));',
      t.t||'_select', t.t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING ((auth.uid() IS NOT NULL) AND (tenant_id = public.get_user_tenant_id()));',
      t.t||'_all', t.t
    );
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon;', t.t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated;', t.t);
  END LOOP;
END $$;

-- 6) Ensure current_alerts_view remains invoker and only authenticated can read
ALTER VIEW public.current_alerts_view SET (security_invoker = true);
REVOKE ALL ON public.current_alerts_view FROM PUBLIC, anon;
GRANT SELECT ON public.current_alerts_view TO authenticated;