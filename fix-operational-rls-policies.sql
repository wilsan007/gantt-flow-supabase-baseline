-- =====================================================
-- FIX: RLS Policies pour Opérations
-- Problème: JWT ne contient pas tenant_id
-- Solution: Utiliser la table profiles pour récupérer le tenant
-- =====================================================

-- 1. Supprimer les anciennes policies
DROP POLICY IF EXISTS op_activities_select ON public.operational_activities;
DROP POLICY IF EXISTS op_activities_insert ON public.operational_activities;
DROP POLICY IF EXISTS op_activities_update ON public.operational_activities;
DROP POLICY IF EXISTS op_activities_delete ON public.operational_activities;

DROP POLICY IF EXISTS op_schedules_select ON public.operational_schedules;
DROP POLICY IF EXISTS op_schedules_insert ON public.operational_schedules;
DROP POLICY IF EXISTS op_schedules_update ON public.operational_schedules;
DROP POLICY IF EXISTS op_schedules_delete ON public.operational_schedules;

DROP POLICY IF EXISTS op_act_templates_select ON public.operational_action_templates;
DROP POLICY IF EXISTS op_act_templates_insert ON public.operational_action_templates;
DROP POLICY IF EXISTS op_act_templates_update ON public.operational_action_templates;
DROP POLICY IF EXISTS op_act_templates_delete ON public.operational_action_templates;

-- =====================================================
-- 2. POLICIES pour operational_activities
-- Utiliser profiles.tenant_id au lieu de auth.jwt()
-- =====================================================

-- Policy: Lecture - Isolation par tenant via profiles
CREATE POLICY op_activities_select ON public.operational_activities
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- Policy: Insertion - Isolation par tenant via profiles
CREATE POLICY op_activities_insert ON public.operational_activities
    FOR INSERT
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
        AND created_by = auth.uid()
    );

-- Policy: Mise à jour - Isolation par tenant via profiles
CREATE POLICY op_activities_update ON public.operational_activities
    FOR UPDATE
    USING (
        tenant_id IN (
            SELECT tenant_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- Policy: Suppression - Isolation par tenant via profiles
CREATE POLICY op_activities_delete ON public.operational_activities
    FOR DELETE
    USING (
        tenant_id IN (
            SELECT tenant_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- =====================================================
-- 3. POLICIES pour operational_schedules
-- =====================================================

CREATE POLICY op_schedules_select ON public.operational_schedules
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY op_schedules_insert ON public.operational_schedules
    FOR INSERT
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM public.operational_activities
            WHERE id = activity_id
              AND tenant_id IN (
                  SELECT tenant_id 
                  FROM public.profiles 
                  WHERE id = auth.uid()
              )
        )
    );

CREATE POLICY op_schedules_update ON public.operational_schedules
    FOR UPDATE
    USING (
        tenant_id IN (
            SELECT tenant_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY op_schedules_delete ON public.operational_schedules
    FOR DELETE
    USING (
        tenant_id IN (
            SELECT tenant_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- =====================================================
-- 4. POLICIES pour operational_action_templates
-- =====================================================

CREATE POLICY op_act_templates_select ON public.operational_action_templates
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY op_act_templates_insert ON public.operational_action_templates
    FOR INSERT
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM public.operational_activities
            WHERE id = activity_id
              AND tenant_id IN (
                  SELECT tenant_id 
                  FROM public.profiles 
                  WHERE id = auth.uid()
              )
        )
    );

CREATE POLICY op_act_templates_update ON public.operational_action_templates
    FOR UPDATE
    USING (
        tenant_id IN (
            SELECT tenant_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY op_act_templates_delete ON public.operational_action_templates
    FOR DELETE
    USING (
        tenant_id IN (
            SELECT tenant_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- =====================================================
-- 5. Vérification
-- =====================================================

-- Voir les policies créées
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('operational_activities', 'operational_schedules', 'operational_action_templates')
ORDER BY tablename, cmd;

-- =====================================================
-- Résultat attendu:
-- ✅ Policies recréées avec profiles.tenant_id
-- ✅ INSERT fonctionne maintenant
-- =====================================================
