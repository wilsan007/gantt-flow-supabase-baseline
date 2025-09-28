-- Script de restauration complète des 28 profils
-- Généré automatiquement le 2025-09-20T23:16:09.321Z
-- Basé sur l'export du 2025-09-20T22:53:19.320Z

-- Désactiver temporairement RLS pour l'insertion
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Supprimer les données existantes (optionnel)
-- TRUNCATE TABLE public.profiles CASCADE;

-- ============================================
-- INSERTION DE TOUS LES PROFILS
-- ============================================

-- Profil 1: Pierre Dubois
INSERT INTO public.profiles (
    id, user_id, tenant_id, full_name, email, phone, avatar_url,
    employee_id, job_title, hire_date, manager_id, contract_type,
    weekly_hours, salary, role, emergency_contact, created_at, updated_at
) VALUES (
    '89624fb2-b86f-47f1-8f32-d2e89c1bcec1', '89624fb2-b86f-47f1-8f32-d2e89c1bcec1', '878c5ac9-4e99-4baf-803a-14f8ac964ec4', 'Pierre Dubois', 'pierre.dubois@example.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'team_lead', NULL, '2025-09-06T15:06:09.432251+00:00', '2025-09-18T18:44:18.504623+00:00'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- Profil 2: Sophie Bernard
INSERT INTO public.profiles (
    id, user_id, tenant_id, full_name, email, phone, avatar_url,
    employee_id, job_title, hire_date, manager_id, contract_type,
    weekly_hours, salary, role, emergency_contact, created_at, updated_at
) VALUES (
    '8e8263b2-1040-4f6d-bc82-5b634323759e', '8e8263b2-1040-4f6d-bc82-5b634323759e', '878c5ac9-4e99-4baf-803a-14f8ac964ec4', 'Sophie Bernard', 'sophie.bernard@example.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'Développeur Backend', NULL, '2025-09-06T15:06:09.432251+00:00', '2025-09-18T18:44:18.504623+00:00'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- Profil 3: Camille Laurent
INSERT INTO public.profiles (
    id, user_id, tenant_id, full_name, email, phone, avatar_url,
    employee_id, job_title, hire_date, manager_id, contract_type,
    weekly_hours, salary, role, emergency_contact, created_at, updated_at
) VALUES (
    'c08609d4-bc6d-4921-b0c7-ef69ed09c16d', 'c08609d4-bc6d-4921-b0c7-ef69ed09c16d', '878c5ac9-4e99-4baf-803a-14f8ac964ec4', 'Camille Laurent', 'camille.laurent@example.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'Développeur Frontend', NULL, '2025-09-06T15:06:09.432251+00:00', '2025-09-18T18:44:18.504623+00:00'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- Profil 4: Jean Martin
INSERT INTO public.profiles (
    id, user_id, tenant_id, full_name, email, phone, avatar_url,
    employee_id, job_title, hire_date, manager_id, contract_type,
    weekly_hours, salary, role, emergency_contact, created_at, updated_at
) VALUES (
    'dbf36b51-76ec-474c-981c-be9f4f8e1fb8', 'dbf36b51-76ec-474c-981c-be9f4f8e1fb8', '878c5ac9-4e99-4baf-803a-14f8ac964ec4', 'Jean Martin', 'jean.martin@example.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'viewer', NULL, '2025-09-06T15:06:09.432251+00:00', '2025-09-18T18:44:18.504623+00:00'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- Profil 5: Marie Dupont
INSERT INTO public.profiles (
    id, user_id, tenant_id, full_name, email, phone, avatar_url,
    employee_id, job_title, hire_date, manager_id, contract_type,
    weekly_hours, salary, role, emergency_contact, created_at, updated_at
) VALUES (
    '54aa6b55-d898-4e14-a337-2ee4477e55db', '54aa6b55-d898-4e14-a337-2ee4477e55db', '878c5ac9-4e99-4baf-803a-14f8ac964ec4', 'Marie Dupont', 'marie.dupont@example.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'project_manager', NULL, '2025-09-06T15:06:09.432251+00:00', '2025-09-18T18:44:18.504623+00:00'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- Profil 6: Lucas Moreau
INSERT INTO public.profiles (
    id, user_id, tenant_id, full_name, email, phone, avatar_url,
    employee_id, job_title, hire_date, manager_id, contract_type,
    weekly_hours, salary, role, emergency_contact, created_at, updated_at
) VALUES (
    '7ba6f266-340b-4904-8503-0670d6534e0a', '7ba6f266-340b-4904-8503-0670d6534e0a', '878c5ac9-4e99-4baf-803a-14f8ac964ec4', 'Lucas Moreau', 'lucas.moreau@example.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'Chef de projet', NULL, '2025-09-06T15:06:09.432251+00:00', '2025-09-18T18:44:18.504623+00:00'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- Profil 7: Admin User
INSERT INTO public.profiles (
    id, user_id, tenant_id, full_name, email, phone, avatar_url,
    employee_id, job_title, hire_date, manager_id, contract_type,
    weekly_hours, salary, role, emergency_contact, created_at, updated_at
) VALUES (
    'a035dcb3-71d8-40d5-a72e-db0be4d399f1', 'a035dcb3-71d8-40d5-a72e-db0be4d399f1', '878c5ac9-4e99-4baf-803a-14f8ac964ec4', 'Admin User', 'admin.user@example.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'hr_manager', NULL, '2025-09-06T21:00:57.949048+00:00', '2025-09-18T18:44:18.504623+00:00'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- Profil 8: Administrateur Wadashaqeen
INSERT INTO public.profiles (
    id, user_id, tenant_id, full_name, email, phone, avatar_url,
    employee_id, job_title, hire_date, manager_id, contract_type,
    weekly_hours, salary, role, emergency_contact, created_at, updated_at
) VALUES (
    '7d3b2727-3b9b-483a-a3fe-9975f62b1dc1', 'ebb4c3fe-6288-41df-972d-4a6f32ed813d', '878c5ac9-4e99-4baf-803a-14f8ac964ec4', 'Administrateur Wadashaqeen', 'administrateur.wadashaqeen@example.com', NULL, NULL, 'ADM001', 'Administrateur tenant', '2025-09-14', NULL, 'CDI', 40, NULL, 'tenant_admin', NULL, '2025-09-14T16:24:30.940806+00:00', '2025-09-18T18:44:18.504623+00:00'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- Profil 9: Awaleh Osman
INSERT INTO public.profiles (
    id, user_id, tenant_id, full_name, email, phone, avatar_url,
    employee_id, job_title, hire_date, manager_id, contract_type,
    weekly_hours, salary, role, emergency_contact, created_at, updated_at
) VALUES (
    'f26f53d3-1917-4706-b98e-da47bbf4bfed', '5c5731ce-75d0-4455-8184-bc42c626cb17', '00000000-0000-0000-0000-000000000000', 'Awaleh Osman', 'awalehnasri@gmail.com', NULL, NULL, NULL, 'Administrateur Systeme', NULL, NULL, 'CDI', 35, NULL, 'super_admin', NULL, '2025-09-16T16:10:16.628419+00:00', '2025-09-18T18:44:18.504623+00:00'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- Profil 10: Nagad Osman
INSERT INTO public.profiles (
    id, user_id, tenant_id, full_name, email, phone, avatar_url,
    employee_id, job_title, hire_date, manager_id, contract_type,
    weekly_hours, salary, role, emergency_contact, created_at, updated_at
) VALUES (
    '38afa674-0122-4d98-bc86-c04e83e374b3', '84088d7c-4b85-43d2-8c0e-020e2847a4cb', 'c468312a-9f23-4b68-9c4f-2f2b65d0ba86', 'Nagad Osman', 'test11@test.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'employee', NULL, '2025-09-16T20:54:20.268558+00:00', '2025-09-16T20:54:20.268558+00:00'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- Profil 11: Meryan Osman
INSERT INTO public.profiles (
    id, user_id, tenant_id, full_name, email, phone, avatar_url,
    employee_id, job_title, hire_date, manager_id, contract_type,
    weekly_hours, salary, role, emergency_contact, created_at, updated_at
) VALUES (
    'a6c00002-b7e8-463c-9032-32dd91ff9c6e', '1413883a-3c36-4344-869d-f6a34c1c5dcc', '847b379f-f626-4d9c-b3ba-337c29b7c6ed', 'Meryan Osman', 'test22@test.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'employee', NULL, '2025-09-16T20:59:14.791807+00:00', '2025-09-16T20:59:14.791807+00:00'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- Profil 12: Najmoudine Osman
INSERT INTO public.profiles (
    id, user_id, tenant_id, full_name, email, phone, avatar_url,
    employee_id, job_title, hire_date, manager_id, contract_type,
    weekly_hours, salary, role, emergency_contact, created_at, updated_at
) VALUES (
    'a0045cbf-d91b-4605-9f54-c9394133ba35', '62dfe776-d50f-439a-9e49-9a9be77c4e93', '6646f376-bbe5-4ba4-b082-465b700a0bc4', 'Najmoudine Osman', 'najmoudine44@yahoo.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'tenant_admin', NULL, '2025-09-17T20:41:04.987591+00:00', '2025-09-18T18:44:18.504623+00:00'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- Profil 13: Najmoudine Osman
INSERT INTO public.profiles (
    id, user_id, tenant_id, full_name, email, phone, avatar_url,
    employee_id, job_title, hire_date, manager_id, contract_type,
    weekly_hours, salary, role, emergency_contact, created_at, updated_at
) VALUES (
    'b9bb3bf3-1e21-4d98-a770-708ad81831a9', '70ed6204-e2d9-4d26-9a52-a36bb2fddacc', '006fae29-70cd-4e0f-bf0d-6b538a0a657d', 'Najmoudine Osman', 'najmou44@yahoo.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'tenant_admin', NULL, '2025-09-17T20:41:04.987591+00:00', '2025-09-18T18:44:18.504623+00:00'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- Profil 14: Najmoudine Osman
INSERT INTO public.profiles (
    id, user_id, tenant_id, full_name, email, phone, avatar_url,
    employee_id, job_title, hire_date, manager_id, contract_type,
    weekly_hours, salary, role, emergency_contact, created_at, updated_at
) VALUES (
    '9988e773-89ab-4501-bc2d-81f24b170904', '70fbeddb-99d8-41b1-8d72-a2b72e0fd173', '556efe95-213d-406b-acda-984e7f0f20e2', 'Najmoudine Osman', 'najmou55@yahoo.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'tenant_admin', NULL, '2025-09-17T20:41:04.987591+00:00', '2025-09-18T18:44:18.504623+00:00'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- Profil 15: Nagad Osman
INSERT INTO public.profiles (
    id, user_id, tenant_id, full_name, email, phone, avatar_url,
    employee_id, job_title, hire_date, manager_id, contract_type,
    weekly_hours, salary, role, emergency_contact, created_at, updated_at
) VALUES (
    '51d2f7b0-e803-4339-8797-bba1af5e5283', '776e9644-9d10-4f57-b075-60260e3fbc83', '343cd29b-5a09-441d-933d-672b7a1750df', 'Nagad Osman', 'nagad11@yahoo.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'tenant_admin', NULL, '2025-09-17T20:41:04.987591+00:00', '2025-09-18T18:44:18.504623+00:00'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- Profil 16: Imran Osman
INSERT INTO public.profiles (
    id, user_id, tenant_id, full_name, email, phone, avatar_url,
    employee_id, job_title, hire_date, manager_id, contract_type,
    weekly_hours, salary, role, emergency_contact, created_at, updated_at
) VALUES (
    '03ba156d-9bdc-4b54-af39-2a8cb6a13921', '895703a3-9050-4e69-b3ed-6ab635b3ed37', '06708a67-5253-4fd2-86d2-8fea43c76fb3', 'Imran Osman', 'imran11@yahoo.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'tenant_admin', NULL, '2025-09-17T20:41:04.987591+00:00', '2025-09-18T18:44:18.504623+00:00'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- Profil 17: Nagad Osman
INSERT INTO public.profiles (
    id, user_id, tenant_id, full_name, email, phone, avatar_url,
    employee_id, job_title, hire_date, manager_id, contract_type,
    weekly_hours, salary, role, emergency_contact, created_at, updated_at
) VALUES (
    '87d91c86-708f-4b52-b5be-6158469849fe', '3ffdcc8e-106b-4224-9b88-67132f9096b1', '458f60b2-6cd3-4359-a727-cfb37a64b4fc', 'Nagad Osman', 'testnagad11@yahoo.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'tenant_admin', NULL, '2025-09-17T20:41:04.987591+00:00', '2025-09-18T18:44:18.504623+00:00'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- Profil 18: Imran Osman
INSERT INTO public.profiles (
    id, user_id, tenant_id, full_name, email, phone, avatar_url,
    employee_id, job_title, hire_date, manager_id, contract_type,
    weekly_hours, salary, role, emergency_contact, created_at, updated_at
) VALUES (
    'c00f25b5-8c44-4335-808e-d84a46b848e6', 'a61224ce-6066-4eda-a3e2-399b0e2e36c1', '73870956-03c5-49a3-b3c3-257bc7e10fc6', 'Imran Osman', 'imran33@yahoo.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'tenant_admin', NULL, '2025-09-17T20:41:04.987591+00:00', '2025-09-18T18:44:18.504623+00:00'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- Profil 19: Meryam Osman
INSERT INTO public.profiles (
    id, user_id, tenant_id, full_name, email, phone, avatar_url,
    employee_id, job_title, hire_date, manager_id, contract_type,
    weekly_hours, salary, role, emergency_contact, created_at, updated_at
) VALUES (
    '7f6e0083-4e4e-40b5-8784-7d86b56f3796', 'b91e166b-63ee-4c5e-9314-2833beedac41', '32eec540-e1d6-44f5-9a9d-f202f6168c7f', 'Meryam Osman', 'meryam22@yahoo.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'tenant_admin', NULL, '2025-09-17T20:41:04.987591+00:00', '2025-09-18T18:44:18.504623+00:00'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- Profil 20: Najmoudine Osman
INSERT INTO public.profiles (
    id, user_id, tenant_id, full_name, email, phone, avatar_url,
    employee_id, job_title, hire_date, manager_id, contract_type,
    weekly_hours, salary, role, emergency_contact, created_at, updated_at
) VALUES (
    '1d75a634-dc20-46ae-897f-20d70da8a396', 'cc32bc40-3282-4368-8c94-1e56bfab405a', '1dbc6384-e5b4-4b88-834c-ebee57c7f424', 'Najmoudine Osman', 'najmou33@yahoo.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'tenant_admin', NULL, '2025-09-17T20:41:04.987591+00:00', '2025-09-18T18:44:18.504623+00:00'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- Profil 21: Imran Osman
INSERT INTO public.profiles (
    id, user_id, tenant_id, full_name, email, phone, avatar_url,
    employee_id, job_title, hire_date, manager_id, contract_type,
    weekly_hours, salary, role, emergency_contact, created_at, updated_at
) VALUES (
    '6467a55c-0843-467b-9caa-07125c8304cc', 'fc558593-4a2c-45ec-8e07-5be2a465dbde', '7cc5492e-81eb-47f1-91a5-c75af7205467', 'Imran Osman', 'medtest11@yahoo.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'tenant_admin', NULL, '2025-09-17T20:41:04.987591+00:00', '2025-09-18T18:44:18.504623+00:00'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- Profil 22: Nagad Osman
INSERT INTO public.profiles (
    id, user_id, tenant_id, full_name, email, phone, avatar_url,
    employee_id, job_title, hire_date, manager_id, contract_type,
    weekly_hours, salary, role, emergency_contact, created_at, updated_at
) VALUES (
    '024fac96-494f-43c2-8a56-5a711fe3da33', '2a1b0b43-c364-49fa-88fc-949b5a30aada', 'e62f5e8f-b148-4743-9572-f1c8073c650c', 'Nagad Osman', 'nagadtest11@yahoo.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'tenant_admin', NULL, '2025-09-17T20:41:04.987591+00:00', '2025-09-18T18:44:18.504623+00:00'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- Profil 23: Imran Osman
INSERT INTO public.profiles (
    id, user_id, tenant_id, full_name, email, phone, avatar_url,
    employee_id, job_title, hire_date, manager_id, contract_type,
    weekly_hours, salary, role, emergency_contact, created_at, updated_at
) VALUES (
    '3a88c5fa-f88b-4360-8f92-a6ead1b80ac1', '8dd04423-0b92-4b78-9883-fdc9b1e43b27', 'b8356bc5-d28d-4e46-b487-4215af8c6522', 'Imran Osman', 'imran66@yahoo.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'tenant_admin', NULL, '2025-09-17T20:41:04.987591+00:00', '2025-09-18T18:44:18.504623+00:00'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- Profil 24: Imran Osman
INSERT INTO public.profiles (
    id, user_id, tenant_id, full_name, email, phone, avatar_url,
    employee_id, job_title, hire_date, manager_id, contract_type,
    weekly_hours, salary, role, emergency_contact, created_at, updated_at
) VALUES (
    'fe3a2d74-a601-4ac4-9ad2-231d91ecbb7d', '4ae5bf5d-da0c-472a-9601-b276d96b8427', '7af77f52-a083-47b0-b789-bb7d328c967d', 'Imran Osman', 'imran22@yahoo.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'tenant_admin', NULL, '2025-09-17T20:41:04.987591+00:00', '2025-09-18T18:44:18.504623+00:00'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- Profil 25: Imran Osman
INSERT INTO public.profiles (
    id, user_id, tenant_id, full_name, email, phone, avatar_url,
    employee_id, job_title, hire_date, manager_id, contract_type,
    weekly_hours, salary, role, emergency_contact, created_at, updated_at
) VALUES (
    'e9a8d104-99bc-4f22-9dcc-5b3cafb64f53', '4e38d614-dbde-4267-964b-c3e431b52b5e', '35273e20-c786-44a0-9200-f544e98cffce', 'Imran Osman', 'imran77@yyahoo.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'tenant_admin', NULL, '2025-09-17T20:41:04.987591+00:00', '2025-09-18T18:44:18.504623+00:00'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- Profil 26: Mohamed Osman
INSERT INTO public.profiles (
    id, user_id, tenant_id, full_name, email, phone, avatar_url,
    employee_id, job_title, hire_date, manager_id, contract_type,
    weekly_hours, salary, role, emergency_contact, created_at, updated_at
) VALUES (
    'ef5398dc-57f1-41ab-9151-488ec6a73364', 'bdef6cd4-3019-456b-aee4-a037dee6ff00', '06c8c1c4-c34c-4447-9f1c-39f0c17bdc75', 'Mohamed Osman', 'medtest1@yahoo.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'tenant_admin', NULL, '2025-09-18T05:52:11.456+00:00', '2025-09-18T18:44:18.504623+00:00'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- Profil 27: Med Osman
INSERT INTO public.profiles (
    id, user_id, tenant_id, full_name, email, phone, avatar_url,
    employee_id, job_title, hire_date, manager_id, contract_type,
    weekly_hours, salary, role, emergency_contact, created_at, updated_at
) VALUES (
    '63bbf39c-275c-43ff-82c6-b03ca71b3dba', '8d512a80-1166-4984-bc0d-69fa9fb70443', 'd38003ba-83dc-49b2-82aa-c42c850998dc', 'Med Osman', 'test99@yahoo.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'tenant_admin', NULL, '2025-09-18T14:53:09.183+00:00', '2025-09-18T18:44:18.504623+00:00'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- Profil 28: Med Osman
INSERT INTO public.profiles (
    id, user_id, tenant_id, full_name, email, phone, avatar_url,
    employee_id, job_title, hire_date, manager_id, contract_type,
    weekly_hours, salary, role, emergency_contact, created_at, updated_at
) VALUES (
    '667be84c-8d88-4320-a1d0-3216e37ce2be', '79ec2ec9-077f-47e2-9415-eaa683f40bc1', '41494ebc-ab04-4730-9eb5-853739df6aa9', 'Med Osman', 'test77@yahoo.com', NULL, NULL, NULL, NULL, NULL, NULL, 'CDI', 35, NULL, 'tenant_admin', NULL, '2025-09-18T15:36:05.564+00:00', '2025-09-18T18:44:18.504623+00:00'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- ============================================
-- VÉRIFICATIONS ET STATISTIQUES
-- ============================================

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

-- Afficher un résumé par rôle
SELECT 
    role,
    COUNT(*) as profile_count
FROM public.profiles
GROUP BY role
ORDER BY profile_count DESC;

-- Restauration complète terminée !
-- 28 profils restaurés avec succès
-- Date: 2025-09-20T23:16:09.324Z
