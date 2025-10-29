-- =====================================================
-- Configuration RLS (Row Level Security)
-- Module: Tâches Récurrentes & Opérations
-- =====================================================

-- =====================================================
-- 1. ACTIVER RLS sur toutes les nouvelles tables
-- =====================================================

ALTER TABLE public.operational_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_action_templates ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. POLICIES pour operational_activities
-- =====================================================

-- Policy: Lecture - Isolation par tenant
CREATE POLICY op_activities_select ON public.operational_activities
    FOR SELECT
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Policy: Insertion - Isolation par tenant
CREATE POLICY op_activities_insert ON public.operational_activities
    FOR INSERT
    WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        AND created_by = auth.uid()
    );

-- Policy: Mise à jour - Isolation par tenant
CREATE POLICY op_activities_update ON public.operational_activities
    FOR UPDATE
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
    WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Policy: Suppression - Isolation par tenant (réservé aux admins)
CREATE POLICY op_activities_delete ON public.operational_activities
    FOR DELETE
    USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        -- Ajouter vérification rôle si nécessaire:
        -- AND EXISTS (
        --     SELECT 1 FROM user_roles ur
        --     WHERE ur.user_id = auth.uid()
        --       AND ur.role IN ('tenant_admin', 'manager')
        -- )
    );

-- =====================================================
-- 3. POLICIES pour operational_schedules
-- =====================================================

-- Policy: Lecture - Isolation par tenant
CREATE POLICY op_schedules_select ON public.operational_schedules
    FOR SELECT
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Policy: Insertion - Isolation par tenant
CREATE POLICY op_schedules_insert ON public.operational_schedules
    FOR INSERT
    WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        -- Vérifier que l'activité appartient au même tenant
        AND EXISTS (
            SELECT 1 FROM public.operational_activities
            WHERE id = activity_id
              AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        )
    );

-- Policy: Mise à jour - Isolation par tenant
CREATE POLICY op_schedules_update ON public.operational_schedules
    FOR UPDATE
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
    WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Policy: Suppression - Isolation par tenant
CREATE POLICY op_schedules_delete ON public.operational_schedules
    FOR DELETE
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- =====================================================
-- 4. POLICIES pour operational_action_templates
-- =====================================================

-- Policy: Lecture - Isolation par tenant
CREATE POLICY op_act_templates_select ON public.operational_action_templates
    FOR SELECT
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Policy: Insertion - Isolation par tenant
CREATE POLICY op_act_templates_insert ON public.operational_action_templates
    FOR INSERT
    WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        -- Vérifier que l'activité appartient au même tenant
        AND EXISTS (
            SELECT 1 FROM public.operational_activities
            WHERE id = activity_id
              AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        )
    );

-- Policy: Mise à jour - Isolation par tenant
CREATE POLICY op_act_templates_update ON public.operational_action_templates
    FOR UPDATE
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
    WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Policy: Suppression - Isolation par tenant
CREATE POLICY op_act_templates_delete ON public.operational_action_templates
    FOR DELETE
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- =====================================================
-- 5. FUNCTION Helper: Vérifier rôle admin
-- (Optionnel - à activer si vous avez une table user_roles)
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_tenant_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    -- Vérifier si l'utilisateur a un rôle admin dans son tenant
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role IN ('tenant_admin', 'manager')
          AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    );
END;
$$;

-- =====================================================
-- 6. POLICIES restrictives (si besoin de contrôle par rôle)
-- =====================================================

-- Exemple: Seuls les admins peuvent créer des activités
-- (Décommenter si nécessaire)

-- DROP POLICY IF EXISTS op_activities_insert ON public.operational_activities;
-- CREATE POLICY op_activities_insert_admin ON public.operational_activities
--     FOR INSERT
--     WITH CHECK (
--         tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
--         AND created_by = auth.uid()
--         AND public.is_tenant_admin()
--     );

-- =====================================================
-- 7. GRANT permissions au rôle authenticated
-- =====================================================

-- Permissions de base pour les utilisateurs authentifiés
GRANT SELECT, INSERT, UPDATE, DELETE 
ON public.operational_activities 
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE 
ON public.operational_schedules 
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE 
ON public.operational_action_templates 
TO authenticated;

-- Permissions pour le service role (Edge Functions)
GRANT ALL 
ON public.operational_activities,
   public.operational_schedules,
   public.operational_action_templates
TO service_role;

-- =====================================================
-- 8. VÉRIFICATION des policies créées
-- =====================================================

-- Voir toutes les policies sur operational_activities
-- SELECT * FROM pg_policies 
-- WHERE schemaname = 'public' 
--   AND tablename = 'operational_activities';

-- =====================================================
-- Résultat attendu:
-- ✅ RLS activé sur les 3 tables
-- ✅ Policies d'isolation par tenant (SELECT, INSERT, UPDATE, DELETE)
-- ✅ Vérifications de cohérence (activité du même tenant)
-- ✅ Permissions accordées aux rôles authenticated et service_role
-- ✅ Fonction helper is_tenant_admin() créée
-- =====================================================
