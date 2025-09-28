-- Script pour restaurer les données de la table profiles après recréation
-- À exécuter APRÈS drop-and-recreate-profiles-table.sql
-- Données basées sur l'export du 2025-09-21

-- ============================================
-- RESTAURATION DES DONNÉES PROFILES
-- ============================================

-- Désactiver temporairement RLS pour l'insertion des données
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Insérer les données sauvegardées (adaptées à la nouvelle structure)
INSERT INTO public.profiles (
    id, user_id, tenant_id, full_name, email, phone, avatar_url,
    employee_id, job_title, hire_date, manager_id, contract_type, 
    weekly_hours, salary, role, emergency_contact, created_at, updated_at
) VALUES 
-- Données principales (adaptées depuis l'export)
('89624fb2-b86f-47f1-8f32-d2e89c1bcec1', '89624fb2-b86f-47f1-8f32-d2e89c1bcec1', '878c5ac9-4e99-4baf-803a-14f8ac964ec4', 'Pierre Dubois', 'pierre.dubois@example.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'team_lead', NULL, '2025-09-06T15:06:09.432251+00:00', '2025-09-18T18:44:18.504623+00:00'),
('8e8263b2-1040-4f6d-bc82-5b634323759e', '8e8263b2-1040-4f6d-bc82-5b634323759e', '878c5ac9-4e99-4baf-803a-14f8ac964ec4', 'Sophie Bernard', 'sophie.bernard@example.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'employee', NULL, '2025-09-06T15:06:09.432251+00:00', '2025-09-18T18:44:18.504623+00:00'),
('c08609d4-bc6d-4921-b0c7-ef69ed09c16d', 'c08609d4-bc6d-4921-b0c7-ef69ed09c16d', '878c5ac9-4e99-4baf-803a-14f8ac964ec4', 'Camille Laurent', 'camille.laurent@example.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'employee', NULL, '2025-09-06T15:06:09.432251+00:00', '2025-09-18T18:44:18.504623+00:00')

-- Note: Seuls quelques exemples sont inclus ici
-- Pour une restauration complète, utiliser les données du fichier profiles-export.sql
-- en adaptant les colonnes à la nouvelle structure

ON CONFLICT (id) DO NOTHING;

-- Réactiver RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Vérifier la restauration
SELECT 
    COUNT(*) as total_profiles,
    COUNT(DISTINCT tenant_id) as unique_tenants,
    COUNT(DISTINCT role) as unique_roles
FROM public.profiles;

-- Données profiles restaurées (partiel - compléter avec profiles-export.sql adapté)
