-- Script pour ajouter la colonne tenant_id à la table profiles existante
-- À exécuter via Supabase Dashboard > SQL Editor

-- 1. Vérifier si la colonne tenant_id existe déjà
DO $$
BEGIN
    -- Ajouter la colonne tenant_id si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'tenant_id' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN tenant_id uuid;
        
        RAISE NOTICE 'Colonne tenant_id ajoutée à la table profiles';
    ELSE
        RAISE NOTICE 'Colonne tenant_id existe déjà dans la table profiles';
    END IF;
END $$;

-- 2. Ajouter les autres colonnes manquantes si nécessaire
DO $$
BEGIN
    -- Ajouter email si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'email' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN email text;
        
        RAISE NOTICE 'Colonne email ajoutée à la table profiles';
    END IF;
    
    -- Ajouter employee_id si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'employee_id' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN employee_id text;
        
        RAISE NOTICE 'Colonne employee_id ajoutée à la table profiles';
    END IF;
    
    -- Ajouter hire_date si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'hire_date' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN hire_date date;
        
        RAISE NOTICE 'Colonne hire_date ajoutée à la table profiles';
    END IF;
    
    -- Ajouter job_title si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'job_title' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN job_title text;
        
        RAISE NOTICE 'Colonne job_title ajoutée à la table profiles';
    END IF;
    
    -- Ajouter manager_id si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'manager_id' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN manager_id uuid;
        
        RAISE NOTICE 'Colonne manager_id ajoutée à la table profiles';
    END IF;
    
    -- Ajouter salary si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'salary' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN salary decimal;
        
        RAISE NOTICE 'Colonne salary ajoutée à la table profiles';
    END IF;
    
    -- Ajouter contract_type si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'contract_type' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN contract_type text DEFAULT 'CDI';
        
        RAISE NOTICE 'Colonne contract_type ajoutée à la table profiles';
    END IF;
    
    -- Ajouter weekly_hours si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'weekly_hours' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN weekly_hours text DEFAULT '35';
        
        RAISE NOTICE 'Colonne weekly_hours ajoutée à la table profiles';
    END IF;
    
    -- Ajouter phone si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'phone' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN phone text;
        
        RAISE NOTICE 'Colonne phone ajoutée à la table profiles';
    END IF;
    
    -- Ajouter emergency_contact si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'emergency_contact' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN emergency_contact text;
        
        RAISE NOTICE 'Colonne emergency_contact ajoutée à la table profiles';
    END IF;
END $$;

-- 3. Vérifier la structure finale
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
    AND table_schema = 'public'
ORDER BY ordinal_position;
