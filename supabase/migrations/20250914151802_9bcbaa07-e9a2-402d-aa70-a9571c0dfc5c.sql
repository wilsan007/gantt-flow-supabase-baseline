-- Nettoyer complètement et recréer les politiques de sécurité

-- Supprimer toutes les politiques existantes sur les tables sensibles
DROP POLICY IF EXISTS "employees_select_restricted" ON public.employees;
DROP POLICY IF EXISTS "employees_modify_admin_only" ON public.employees;
DROP POLICY IF EXISTS "candidates_admin_access_only" ON public.candidates;
DROP POLICY IF EXISTS "payrolls_admin_access_only" ON public.employee_payrolls;
DROP POLICY IF EXISTS "payrolls_self_view_only" ON public.employee_payrolls;
DROP POLICY IF EXISTS "profiles_self_or_admin_view" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_modify" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_modify" ON public.profiles;
DROP POLICY IF EXISTS "alerts_admin_access" ON public.alert_instances;
DROP POLICY IF EXISTS "alert_types_admin_access" ON public.alert_types;
DROP POLICY IF EXISTS "alert_solutions_admin_access" ON public.alert_solutions;

-- Supprimer toutes les autres politiques existantes
DROP POLICY IF EXISTS "Users can see own memberships" ON public.tenant_members;

-- EMPLOYEES - Sécurisation maximale
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employees_ultra_restricted"
ON public.employees FOR SELECT TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND 
  (public.is_tenant_admin() OR user_id = auth.uid())
);

CREATE POLICY "employees_admin_only_write"
ON public.employees FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = public.get_user_tenant_id() AND 
  public.is_tenant_admin()
);

CREATE POLICY "employees_admin_only_update"
ON public.employees FOR UPDATE TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND 
  public.is_tenant_admin()
);

CREATE POLICY "employees_admin_only_delete"
ON public.employees FOR DELETE TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND 
  public.is_tenant_admin()
);

-- CANDIDATES - Admin seulement
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "candidates_admin_only"
ON public.candidates FOR ALL TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND 
  public.is_tenant_admin()
);

-- PAYROLLS - Ultra restrictif
ALTER TABLE public.employee_payrolls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payrolls_admin_only"
ON public.employee_payrolls FOR ALL TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND 
  public.is_tenant_admin()
);

-- PROFILES - Self ou admin uniquement
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_restricted_access"
ON public.profiles FOR SELECT TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND 
  (public.is_tenant_admin() OR user_id = auth.uid())
);

CREATE POLICY "profiles_self_edit"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = public.get_user_tenant_id() AND 
  user_id = auth.uid()
);

CREATE POLICY "profiles_self_update"
ON public.profiles FOR UPDATE TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND 
  (user_id = auth.uid() OR public.is_tenant_admin())
);

-- ALERTES - Admin seulement
ALTER TABLE public.alert_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_type_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_instance_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alerts_admin_only"
ON public.alert_instances FOR ALL TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND 
  public.is_tenant_admin()
);

CREATE POLICY "alert_types_admin_only"
ON public.alert_types FOR ALL TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND 
  public.is_tenant_admin()
);

CREATE POLICY "alert_solutions_admin_only"
ON public.alert_solutions FOR ALL TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND 
  public.is_tenant_admin()
);

CREATE POLICY "alert_type_solutions_admin_only"
ON public.alert_type_solutions FOR ALL TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND 
  public.is_tenant_admin()
);

CREATE POLICY "alert_recommendations_admin_only"
ON public.alert_instance_recommendations FOR ALL TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND 
  public.is_tenant_admin()
);

-- TENANT MEMBERS - Self access seulement
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_members_self_only"
ON public.tenant_members FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Révoquer TOUS les privilèges publics et anonymes
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;

-- Accorder l'accès minimal requis aux utilisateurs authentifiés seulement
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;