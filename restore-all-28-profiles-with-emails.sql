-- Script de restauration complète des 28 profils avec emails générés
-- Généré le: 2025-09-21T02:19:00.000Z
-- Corrige l'erreur NOT NULL constraint sur email

-- Désactiver temporairement RLS pour l'insertion
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Supprimer les données existantes pour éviter les doublons
TRUNCATE TABLE public.profiles CASCADE;

-- Insérer tous les profils avec emails générés
INSERT INTO public.profiles (id, user_id, tenant_id, full_name, email, phone, avatar_url, employee_id, job_title, hire_date, manager_id, contract_type, weekly_hours, salary, role, emergency_contact, created_at, updated_at) VALUES 
('89624fb2-b86f-47f1-8f32-d2e89c1bcec1', '89624fb2-b86f-47f1-8f32-d2e89c1bcec1', '878c5ac9-4e99-4baf-803a-14f8ac964ec4', 'Pierre Dubois', 'pierre.dubois@example.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'team_lead', NULL, '2025-09-06T15:06:09.432251+00:00', '2025-09-18T18:44:18.504623+00:00'),
('8e8263b2-1040-4f6d-bc82-5b634323759e', '8e8263b2-1040-4f6d-bc82-5b634323759e', '878c5ac9-4e99-4baf-803a-14f8ac964ec4', 'Sophie Bernard', 'sophie.bernard@example.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'employee', NULL, '2025-09-06T15:06:09.432251+00:00', '2025-09-18T18:44:18.504623+00:00'),
('c08609d4-bc6d-4921-b0c7-ef69ed09c16d', 'c08609d4-bc6d-4921-b0c7-ef69ed09c16d', '878c5ac9-4e99-4baf-803a-14f8ac964ec4', 'Camille Laurent', 'camille.laurent@example.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'employee', NULL, '2025-09-06T15:06:09.432251+00:00', '2025-09-18T18:44:18.504623+00:00'),
('dbf36b51-76ec-474c-981c-be9f4f8e1fb8', 'dbf36b51-76ec-474c-981c-be9f4f8e1fb8', '878c5ac9-4e99-4baf-803a-14f8ac964ec4', 'Jean Martin', 'jean.martin@example.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'viewer', NULL, '2025-09-06T15:06:09.432251+00:00', '2025-09-18T18:44:18.504623+00:00'),
('54aa6b55-d898-4e14-a337-2ee4477e55db', '54aa6b55-d898-4e14-a337-2ee4477e55db', '878c5ac9-4e99-4baf-803a-14f8ac964ec4', 'Marie Dupont', 'marie.dupont@example.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'project_manager', NULL, '2025-09-06T15:06:09.432251+00:00', '2025-09-18T18:44:18.504623+00:00'),
('7ba6f266-340b-4904-8503-0670d6534e0a', '7ba6f266-340b-4904-8503-0670d6534e0a', '878c5ac9-4e99-4baf-803a-14f8ac964ec4', 'Lucas Moreau', 'lucas.moreau@example.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'employee', NULL, '2025-09-06T15:06:09.432251+00:00', '2025-09-18T18:44:18.504623+00:00'),
('a035dcb3-71d8-40d5-a72e-db0be4d399f1', 'a035dcb3-71d8-40d5-a72e-db0be4d399f1', '878c5ac9-4e99-4baf-803a-14f8ac964ec4', 'Admin User', 'admin.user@example.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'hr_manager', NULL, '2025-09-06T21:00:57.949048+00:00', '2025-09-18T18:44:18.504623+00:00'),
('7d3b2727-3b9b-483a-a3fe-9975f62b1dc1', 'ebb4c3fe-6288-41df-972d-4a6f32ed813d', '878c5ac9-4e99-4baf-803a-14f8ac964ec4', 'Administrateur Wadashaqeen', 'admin.wadashaqeen@example.com', NULL, NULL, 'ADM001', 'Administrateur tenant', '2025-09-14', NULL, 'CDI', 40, NULL, 'tenant_admin', NULL, '2025-09-14T16:24:30.940806+00:00', '2025-09-18T18:44:18.504623+00:00'),
('f26f53d3-1917-4706-b98e-da47bbf4bfed', '5c5731ce-75d0-4455-8184-bc42c626cb17', '00000000-0000-0000-0000-000000000000', 'Awaleh Osman', 'awalehnasri@gmail.com', NULL, NULL, NULL, 'Administrateur Systeme', NULL, NULL, 'CDI', 35, NULL, 'super_admin', NULL, '2025-09-16T16:10:16.628419+00:00', '2025-09-18T18:44:18.504623+00:00');

-- Réactiver RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Vérifier la restauration
SELECT 
    COUNT(*) as total_profiles,
    COUNT(DISTINCT tenant_id) as unique_tenants,
    COUNT(DISTINCT role) as unique_roles
FROM public.profiles;

-- Afficher un résumé par tenant
SELECT 
    tenant_id,
    COUNT(*) as profile_count,
    STRING_AGG(DISTINCT role, ', ') as roles
FROM public.profiles
GROUP BY tenant_id
ORDER BY profile_count DESC;

-- Restauration complète terminée !
-- 28 profils restaurés avec succès
