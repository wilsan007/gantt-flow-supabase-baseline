-- Migration: RLS Policies - Partie 1 (Modules RH et Finances)
-- Date: 2025-01-11
-- Description: Policies granulaires pour modules RH et Finances
-- Partie 2/3 de la configuration RLS

BEGIN;

DO $$
BEGIN
  RAISE NOTICE '🔐 Configuration RLS - Partie 1 (RH + Finances)...';
  RAISE NOTICE '';
END $$;

-- ============================================
-- MODULE RH: EMPLOYEES (6 policies)
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '👥 Module RH - Employees...';
END $$;

-- Policy 1: Lecture pour tous les utilisateurs du tenant
DROP POLICY IF EXISTS "employees_read_all" ON employees;
CREATE POLICY "employees_read_all" ON employees
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
  );

-- Policy 2: Lecture de son propre profil
DROP POLICY IF EXISTS "employees_read_self" ON employees;
CREATE POLICY "employees_read_self" ON employees
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy 3: Insertion pour RH uniquement
DROP POLICY IF EXISTS "employees_insert_hr" ON employees;
CREATE POLICY "employees_insert_hr" ON employees
  FOR INSERT
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin', 'super_admin'])
  );

-- Policy 4: Modification pour RH uniquement
DROP POLICY IF EXISTS "employees_update_hr" ON employees;
CREATE POLICY "employees_update_hr" ON employees
  FOR UPDATE
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin', 'super_admin'])
  );

-- Policy 5: Suppression pour RH uniquement
DROP POLICY IF EXISTS "employees_delete_hr" ON employees;
CREATE POLICY "employees_delete_hr" ON employees
  FOR DELETE
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin', 'super_admin'])
  );

-- Policy 6: Mise à jour de son propre profil
DROP POLICY IF EXISTS "employees_update_self" ON employees;
CREATE POLICY "employees_update_self" ON employees
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DO $$
BEGIN
  RAISE NOTICE '  ✅ 6 policies Employees créées';
END $$;

-- ============================================
-- MODULE RH: ABSENCES (4 policies)
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📅 Module RH - Absences...';
END $$;

DROP POLICY IF EXISTS "absences_read_all" ON absences;
CREATE POLICY "absences_read_all" ON absences
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
  );

DROP POLICY IF EXISTS "absences_create_self" ON absences;
CREATE POLICY "absences_create_self" ON absences
  FOR INSERT
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "absences_update_hr" ON absences;
CREATE POLICY "absences_update_hr" ON absences
  FOR UPDATE
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
  );

DROP POLICY IF EXISTS "absences_delete_hr" ON absences;
CREATE POLICY "absences_delete_hr" ON absences
  FOR DELETE
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
  );

DO $$
BEGIN
  RAISE NOTICE '  ✅ 4 policies Absences créées';
END $$;

-- ============================================
-- MODULE RH: EMPLOYEE_DOCUMENTS (3 policies)
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📄 Module RH - Documents...';
END $$;

DROP POLICY IF EXISTS "documents_read_self" ON employee_documents;
CREATE POLICY "documents_read_self" ON employee_documents
  FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "documents_read_hr" ON employee_documents;
CREATE POLICY "documents_read_hr" ON employee_documents
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
  );

DROP POLICY IF EXISTS "documents_manage_hr" ON employee_documents;
CREATE POLICY "documents_manage_hr" ON employee_documents
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
  );

DO $$
BEGIN
  RAISE NOTICE '  ✅ 3 policies Documents créées';
END $$;

-- ============================================
-- MODULE FINANCES: EMPLOYEE_PAYROLLS (2 policies)
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '💰 Module Finances - Payrolls...';
END $$;

DROP POLICY IF EXISTS "payrolls_read_self" ON employee_payrolls;
CREATE POLICY "payrolls_read_self" ON employee_payrolls
  FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "payrolls_manage_payroll" ON employee_payrolls;
CREATE POLICY "payrolls_manage_payroll" ON employee_payrolls
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND public.user_has_role(ARRAY['payroll_admin', 'hr_admin', 'tenant_admin'])
  );

DO $$
BEGIN
  RAISE NOTICE '  ✅ 2 policies Payrolls créées';
END $$;

-- ============================================
-- MODULE FINANCES: EXPENSE_REPORTS (3 policies)
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '💳 Module Finances - Expense Reports...';
END $$;

DROP POLICY IF EXISTS "expenses_read_self" ON expense_reports;
CREATE POLICY "expenses_read_self" ON expense_reports
  FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "expenses_create_self" ON expense_reports;
CREATE POLICY "expenses_create_self" ON expense_reports
  FOR INSERT
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "expenses_manage_finance" ON expense_reports;
CREATE POLICY "expenses_manage_finance" ON expense_reports
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND public.user_has_role(ARRAY['finance_admin', 'hr_admin', 'tenant_admin'])
  );

DO $$
BEGIN
  RAISE NOTICE '  ✅ 3 policies Expense Reports créées';
END $$;

-- ============================================
-- MODULE FINANCES: EXPENSE_ITEMS (2 policies)
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🧾 Module Finances - Expense Items...';
END $$;

DROP POLICY IF EXISTS "expense_items_read" ON expense_items;
CREATE POLICY "expense_items_read" ON expense_items
  FOR SELECT
  USING (
    report_id IN (
      SELECT id FROM expense_reports
      WHERE employee_id IN (
        SELECT id FROM employees WHERE user_id = auth.uid()
      )
    )
    OR public.user_has_role(ARRAY['finance_admin', 'hr_admin', 'tenant_admin'])
  );

DROP POLICY IF EXISTS "expense_items_manage" ON expense_items;
CREATE POLICY "expense_items_manage" ON expense_items
  FOR ALL
  USING (
    report_id IN (
      SELECT id FROM expense_reports
      WHERE employee_id IN (
        SELECT id FROM employees WHERE user_id = auth.uid()
      )
      AND status = 'draft'
    )
    OR public.user_has_role(ARRAY['finance_admin', 'tenant_admin'])
  )
  WITH CHECK (
    report_id IN (
      SELECT id FROM expense_reports
      WHERE employee_id IN (
        SELECT id FROM employees WHERE user_id = auth.uid()
      )
      AND status = 'draft'
    )
    OR public.user_has_role(ARRAY['finance_admin', 'tenant_admin'])
  );

DO $$
BEGIN
  RAISE NOTICE '  ✅ 2 policies Expense Items créées';
END $$;

-- ============================================
-- MODULE FINANCES: PAYROLL_PERIODS (2 policies)
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📊 Module Finances - Payroll Periods...';
END $$;

DROP POLICY IF EXISTS "payroll_periods_read" ON payroll_periods;
CREATE POLICY "payroll_periods_read" ON payroll_periods
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
  );

DROP POLICY IF EXISTS "payroll_periods_manage" ON payroll_periods;
CREATE POLICY "payroll_periods_manage" ON payroll_periods
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND public.user_has_role(ARRAY['payroll_admin', 'tenant_admin'])
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND public.user_has_role(ARRAY['payroll_admin', 'tenant_admin'])
  );

DO $$
BEGIN
  RAISE NOTICE '  ✅ 2 policies Payroll Periods créées';
END $$;

-- ============================================
-- MODULE FINANCES: PAYROLL_COMPONENTS (2 policies)
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🧮 Module Finances - Payroll Components...';
END $$;

DROP POLICY IF EXISTS "payroll_components_read" ON payroll_components;
CREATE POLICY "payroll_components_read" ON payroll_components
  FOR SELECT
  USING (
    payroll_id IN (
      SELECT id FROM employee_payrolls
      WHERE employee_id IN (
        SELECT id FROM employees WHERE user_id = auth.uid()
      )
    )
    OR public.user_has_role(ARRAY['payroll_admin', 'hr_admin', 'tenant_admin'])
  );

DROP POLICY IF EXISTS "payroll_components_manage" ON payroll_components;
CREATE POLICY "payroll_components_manage" ON payroll_components
  FOR ALL
  USING (
    payroll_id IN (
      SELECT id FROM employee_payrolls
      WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
    AND public.user_has_role(ARRAY['payroll_admin', 'tenant_admin'])
  )
  WITH CHECK (
    payroll_id IN (
      SELECT id FROM employee_payrolls
      WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
    AND public.user_has_role(ARRAY['payroll_admin', 'tenant_admin'])
  );

DO $$
BEGIN
  RAISE NOTICE '  ✅ 2 policies Payroll Components créées';
END $$;

-- ============================================
-- MODULE FINANCES: TIMESHEETS (4 policies)
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '⏰ Module Finances - Timesheets...';
END $$;

DROP POLICY IF EXISTS "timesheets_read_self" ON timesheets;
CREATE POLICY "timesheets_read_self" ON timesheets
  FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "timesheets_insert_self" ON timesheets;
CREATE POLICY "timesheets_insert_self" ON timesheets
  FOR INSERT
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "timesheets_update_self" ON timesheets;
CREATE POLICY "timesheets_update_self" ON timesheets
  FOR UPDATE
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "timesheets_manage_managers" ON timesheets;
CREATE POLICY "timesheets_manage_managers" ON timesheets
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND public.user_has_role(ARRAY['project_manager', 'hr_admin', 'tenant_admin'])
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND public.user_has_role(ARRAY['project_manager', 'hr_admin', 'tenant_admin'])
  );

DO $$
BEGIN
  RAISE NOTICE '  ✅ 4 policies Timesheets créées';
END $$;

-- ============================================
-- RÉSUMÉ PARTIE 1
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '✅ PARTIE 1 COMPLÉTÉE (RH + Finances)';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Résumé:';
  RAISE NOTICE '   • Employees: 6 policies';
  RAISE NOTICE '   • Absences: 4 policies';
  RAISE NOTICE '   • Documents: 3 policies';
  RAISE NOTICE '   • Payrolls: 2 policies';
  RAISE NOTICE '   • Expenses: 5 policies';
  RAISE NOTICE '   • Payroll Periods: 2 policies';
  RAISE NOTICE '   • Payroll Components: 2 policies';
  RAISE NOTICE '   • Timesheets: 4 policies';
  RAISE NOTICE '   • Total: 28 policies créées';
  RAISE NOTICE '';
  RAISE NOTICE '➡️  Continuez avec: 20250111000203_rls_policies_part2.sql';
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

COMMIT;
