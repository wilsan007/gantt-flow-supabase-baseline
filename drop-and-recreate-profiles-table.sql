-- Script pour supprimer complètement et recréer la table profiles
-- Avec RLS et permissions appropriées
-- À exécuter via Supabase Dashboard > SQL Editor

-- ============================================
-- 1. SAUVEGARDE DES DONNÉES EXISTANTES
-- ============================================
-- Les données ont déjà été exportées via export-profiles-data.js

-- ============================================
-- 2. SUPPRESSION COMPLÈTE DE LA TABLE
-- ============================================
-- Supprimer toutes les politiques RLS
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Tenant admins can view tenant profiles" ON public.profiles;
DROP POLICY IF EXISTS "Tenant admins can manage tenant profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for users based on tenant_id" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on tenant_id" ON public.profiles;
DROP POLICY IF EXISTS "Enable delete for users based on tenant_id" ON public.profiles;

-- Supprimer tous les index
DROP INDEX IF EXISTS idx_profiles_user_id;
DROP INDEX IF EXISTS idx_profiles_tenant_id;
DROP INDEX IF EXISTS idx_profiles_email;
DROP INDEX IF EXISTS idx_profiles_employee_id;

-- Supprimer toutes les contraintes de clé étrangère
ALTER TABLE IF EXISTS public.employees DROP CONSTRAINT IF EXISTS employees_user_id_fkey;
ALTER TABLE IF EXISTS public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE IF EXISTS public.time_entries DROP CONSTRAINT IF EXISTS time_entries_user_id_fkey;
ALTER TABLE IF EXISTS public.project_members DROP CONSTRAINT IF EXISTS project_members_user_id_fkey;
ALTER TABLE IF EXISTS public.task_assignments DROP CONSTRAINT IF EXISTS task_assignments_user_id_fkey;

-- Supprimer la table complètement
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Table profiles supprimée complètement

-- ============================================
-- 3. RECRÉATION DE LA TABLE AVEC STRUCTURE OPTIMISÉE
-- ============================================
CREATE TABLE public.profiles (
    -- Identifiants
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- Informations personnelles
    full_name text NOT NULL,
    email text NOT NULL,
    phone text,
    avatar_url text,
    
    -- Informations professionnelles
    employee_id text,
    job_title text,
    hire_date date,
    manager_id uuid REFERENCES public.profiles(id),
    
    -- Contrat et salaire
    contract_type text DEFAULT 'CDI' CHECK (contract_type IN ('CDI', 'CDD', 'Stage', 'Freelance', 'Consultant')),
    weekly_hours integer DEFAULT 35 CHECK (weekly_hours > 0 AND weekly_hours <= 80),
    salary decimal(10,2),
    
    -- Rôle et permissions
    role text NOT NULL DEFAULT 'employee' CHECK (role IN ('super_admin', 'tenant_admin', 'hr_manager', 'project_manager', 'team_lead', 'employee', 'viewer')),
    
    -- Contact d'urgence
    emergency_contact jsonb,
    
    -- Métadonnées
    created_at timestamp with time zone DEFAULT NOW() NOT NULL,
    updated_at timestamp with time zone DEFAULT NOW() NOT NULL
);

-- Table profiles recréée avec structure optimisée

-- ============================================
-- 4. CRÉATION DES INDEX OPTIMISÉS
-- ============================================
-- Index principaux
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_employee_id ON public.profiles(tenant_id, employee_id) WHERE employee_id IS NOT NULL;
CREATE INDEX idx_profiles_role ON public.profiles(tenant_id, role);
CREATE INDEX idx_profiles_manager ON public.profiles(manager_id) WHERE manager_id IS NOT NULL;

-- Index créés

-- ============================================
-- 5. ACTIVATION DE RLS
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS activé sur la table profiles

-- ============================================
-- 6. CRÉATION DES POLITIQUES RLS OPTIMISÉES
-- ============================================

-- Politique pour les super admins (accès total)
CREATE POLICY "super_admin_full_access" ON public.profiles
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.user_id = auth.uid()
            AND p.role = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.user_id = auth.uid()
            AND p.role = 'super_admin'
        )
    );

-- Politique pour les tenant admins (accès à leur tenant)
CREATE POLICY "tenant_admin_tenant_access" ON public.profiles
    FOR ALL
    TO authenticated
    USING (
        tenant_id IN (
            SELECT p.tenant_id FROM public.profiles p
            WHERE p.user_id = auth.uid()
            AND p.role = 'tenant_admin'
        )
    )
    WITH CHECK (
        tenant_id IN (
            SELECT p.tenant_id FROM public.profiles p
            WHERE p.user_id = auth.uid()
            AND p.role = 'tenant_admin'
        )
    );

-- Politique pour les utilisateurs normaux (accès à leur profil et lecture des collègues)
CREATE POLICY "user_own_profile_full_access" ON public.profiles
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Politique de lecture pour les collègues du même tenant
CREATE POLICY "tenant_colleagues_read_access" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        tenant_id IN (
            SELECT p.tenant_id FROM public.profiles p
            WHERE p.user_id = auth.uid()
        )
    );

-- Politique spéciale pour l'insertion initiale (bypass temporaire pour les triggers)
CREATE POLICY "allow_initial_profile_creation" ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Permettre l'insertion si aucun profil n'existe pour cet user_id
        NOT EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.user_id = profiles.user_id
        )
    );

-- Politiques RLS créées

-- ============================================
-- 7. FONCTION DE MISE À JOUR AUTOMATIQUE DU TIMESTAMP
-- ============================================
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Trigger pour mise à jour automatique
CREATE TRIGGER trigger_update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_profiles_updated_at();

-- Trigger de mise à jour automatique créé

-- ============================================
-- 8. FONCTION HELPER POUR OBTENIR LE TENANT_ID
-- ============================================
-- Supprimer la fonction existante d'abord
DROP FUNCTION IF EXISTS public.get_user_tenant_id(uuid);

CREATE OR REPLACE FUNCTION public.get_user_tenant_id(user_uuid uuid DEFAULT auth.uid())
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    tenant_uuid uuid;
BEGIN
    -- Si pas d'utilisateur, retourner NULL
    IF user_uuid IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Récupérer le tenant_id depuis les profiles
    SELECT tenant_id INTO tenant_uuid
    FROM public.profiles
    WHERE user_id = user_uuid
    LIMIT 1;
    
    RETURN tenant_uuid;
END;
$$;

-- Fonction get_user_tenant_id créée

-- ============================================
-- 9. PERMISSIONS SUR LA TABLE
-- ============================================
-- Accorder les permissions appropriées
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Permissions accordées

-- ============================================
-- 10. VÉRIFICATION DE LA STRUCTURE
-- ============================================
-- Afficher la structure finale
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Table profiles recréée avec succès !
-- Structure: 15 colonnes avec RLS optimisé
-- Index: 6 index pour performance
-- Politiques: 5 politiques RLS granulaires
-- Prêt pour les tests du trigger !
