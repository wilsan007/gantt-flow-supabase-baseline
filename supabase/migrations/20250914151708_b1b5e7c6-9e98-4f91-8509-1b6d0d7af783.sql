-- Corriger les vulnérabilités de sécurité avec syntaxe appropriée

-- 0) Drop the security view entirely to avoid exposing config
DROP VIEW IF EXISTS public.security_status CASCADE;

-- 1) EMPLOYEES - nettoyer toutes les politiques existantes
DROP POLICY IF EXISTS "Department heads can view department employees" ON public.employees;
DROP POLICY IF EXISTS "HR admins can manage employees" ON public.employees;
DROP POLICY IF EXISTS "HR admins can manage tenant employees" ON public.employees;
DROP POLICY IF EXISTS "HR admins can view all tenant employees" ON public.employees;
DROP POLICY IF EXISTS "HR admins can view employees" ON public.employees;
DROP POLICY IF EXISTS "Managers can update direct reports basic info" ON public.employees;
DROP POLICY IF EXISTS "Managers can view direct reports" ON public.employees;
DROP POLICY IF EXISTS "Users view own employee record" ON public.employees;

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Créer des politiques strictes pour employees
CREATE POLICY "employees_select_restricted"
ON public.employees FOR SELECT TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND 
  (public.is_tenant_admin() OR user_id = auth.uid())
);

CREATE POLICY "employees_modify_admin_only"
ON public.employees FOR ALL TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND 
  public.is_tenant_admin()
);

-- 2) CANDIDATES - strict admin seulement
DROP POLICY IF EXISTS "HR admins manage candidates" ON public.candidates;

ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "candidates_admin_access_only"
ON public.candidates FOR ALL TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND 
  public.is_tenant_admin()
);

-- 3) EMPLOYEE PAYROLLS - très restrictif
DROP POLICY IF EXISTS "HR admins manage payrolls" ON public.employee_payrolls;
DROP POLICY IF EXISTS "HR admins view payrolls" ON public.employee_payrolls;

ALTER TABLE public.employee_payrolls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payrolls_admin_access_only"
ON public.employee_payrolls FOR ALL TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND 
  public.is_tenant_admin()
);

-- Option pour voir ses propres données de paie
CREATE POLICY "payrolls_self_view_only"
ON public.employee_payrolls FOR SELECT TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND
  employee_id IN (
    SELECT id FROM public.employees 
    WHERE user_id = auth.uid() AND tenant_id = public.get_user_tenant_id()
  )
);

-- 4) PROFILES - restreindre aux self ou admin
-- Création si la table n'existe pas
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,  
  tenant_id uuid DEFAULT public.get_user_tenant_id(),
  full_name text,
  email text,
  role text DEFAULT 'user',
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, tenant_id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Nettoyer anciennes politiques
DROP POLICY IF EXISTS "Users can view tenant profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage tenant profiles" ON public.profiles;

CREATE POLICY "profiles_self_or_admin_view"
ON public.profiles FOR SELECT TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND 
  (public.is_tenant_admin() OR user_id = auth.uid())
);

CREATE POLICY "profiles_self_modify"
ON public.profiles FOR ALL TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND 
  user_id = auth.uid()
);

CREATE POLICY "profiles_admin_modify"
ON public.profiles FOR ALL TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND 
  public.is_tenant_admin()
);

-- 5) ALERTES - restreindre l'accès
DROP POLICY IF EXISTS "alert_instances_select" ON public.alert_instances;
DROP POLICY IF EXISTS "alert_instances_all" ON public.alert_instances;
DROP POLICY IF EXISTS "alert_types_select" ON public.alert_types;
DROP POLICY IF EXISTS "alert_types_all" ON public.alert_types;
DROP POLICY IF EXISTS "alert_solutions_select" ON public.alert_solutions;
DROP POLICY IF EXISTS "alert_solutions_all" ON public.alert_solutions;

ALTER TABLE public.alert_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_solutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alerts_admin_access"
ON public.alert_instances FOR ALL TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND 
  public.is_tenant_admin()
);

CREATE POLICY "alert_types_admin_access"
ON public.alert_types FOR ALL TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND 
  public.is_tenant_admin()
);

CREATE POLICY "alert_solutions_admin_access"
ON public.alert_solutions FOR ALL TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND 
  public.is_tenant_admin()
);

-- 6) Révoquer tous les privilèges publics
REVOKE ALL ON public.employees FROM PUBLIC, anon;
REVOKE ALL ON public.candidates FROM PUBLIC, anon;
REVOKE ALL ON public.employee_payrolls FROM PUBLIC, anon;
REVOKE ALL ON public.profiles FROM PUBLIC, anon;
REVOKE ALL ON public.alert_instances FROM PUBLIC, anon;
REVOKE ALL ON public.alert_types FROM PUBLIC, anon;
REVOKE ALL ON public.alert_solutions FROM PUBLIC, anon;
REVOKE ALL ON public.current_alerts_view FROM PUBLIC, anon;

-- Accorder l'accès minimal aux utilisateurs authentifiés
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_payrolls TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alert_instances TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alert_types TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alert_solutions TO authenticated;
GRANT SELECT ON public.current_alerts_view TO authenticated;