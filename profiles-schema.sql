-- Schéma complet de la table profiles
-- Généré le: 2025-09-20T22:56:27.713Z
-- Base: https://qliinxtanjdnwxlvnxji.supabase.co

-- Supprimer la table si elle existe (pour recréation)
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Créer la table profiles
CREATE TABLE public.profiles (
    id uuid,
    user_id uuid,
    full_name text,
    avatar_url nullable,
    role text,
    created_at text,
    updated_at text,
    tenant_id uuid,
    employee_id nullable,
    hire_date nullable,
    job_title nullable,
    manager_id nullable,
    salary nullable,
    contract_type text,
    weekly_hours integer,
    phone nullable,
    emergency_contact nullable,
    email nullable
);

