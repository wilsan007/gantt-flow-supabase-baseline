-- Script SQL pour configurer l'utilisateur comme admin tenant
-- À exécuter directement dans Supabase SQL Editor

-- Variables
-- USER_ID: ebb4c3fe-6288-41df-972d-4a6f32ed813d
-- USER_EMAIL: zdouce.zz@gmail.com
-- TENANT_ID: 878c5ac9-4e99-4baf-803a-14f8ac964ec4

-- 1. Créer/Mettre à jour le profil dans la table profiles
INSERT INTO profiles (
    user_id,
    tenant_id,
    full_name,
    role,
    job_title,
    employee_id,
    hire_date,
    contract_type,
    weekly_hours,
    created_at,
    updated_at
) VALUES (
    'ebb4c3fe-6288-41df-972d-4a6f32ed813d',
    '878c5ac9-4e99-4baf-803a-14f8ac964ec4',
    'Administrateur Wadashaqeen',
    'admin',
    'Administrateur Système',
    'ADM001',
    CURRENT_DATE,
    'CDI',
    40,
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    tenant_id = '878c5ac9-4e99-4baf-803a-14f8ac964ec4'::UUID,
    role = 'tenant_admin',
    job_title = 'Administrateur Système',
    updated_at = NOW();

-- 2. Créer/Mettre à jour l'entrée user_roles (tenant_members supprimée)
INSERT INTO public.user_roles (
    user_id,
    role_id,
    context_type,
    context_id,
    tenant_id,
    assigned_by,
    assigned_at,
    is_active
) VALUES (
    'ebb4c3fe-6288-41df-972d-4a6f32ed813d'::UUID,
    (SELECT id FROM public.roles WHERE name = 'tenant_admin' AND tenant_id = '878c5ac9-4e99-4baf-803a-14f8ac964ec4'::UUID LIMIT 1),
    'global',
    '878c5ac9-4e99-4baf-803a-14f8ac964ec4'::UUID,
    '878c5ac9-4e99-4baf-803a-14f8ac964ec4'::UUID,
    'ebb4c3fe-6288-41df-972d-4a6f32ed813d'::UUID,
    NOW(),
    true
) ON CONFLICT (user_id, role_id, context_type, context_id) DO UPDATE SET
    is_active = true,
    updated_at = NOW();

-- 3. Créer/Mettre à jour l'entrée employees
INSERT INTO employees (
    user_id,
    tenant_id,
    email,
    full_name,
    employee_id,
    job_title,
    hire_date,
    contract_type,
    status,
    weekly_hours,
    created_at,
    updated_at
) VALUES (
    'ebb4c3fe-6288-41df-972d-4a6f32ed813d',
    '878c5ac9-4e99-4baf-803a-14f8ac964ec4',
    'zdouce.zz@gmail.com',
    'Administrateur Wadashaqeen',
    'ADM001',
    'Administrateur Système',
    CURRENT_DATE,
    'CDI',
    'active',
    40,
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    tenant_id = '878c5ac9-4e99-4baf-803a-14f8ac964ec4'::UUID,
    status = 'active',
    updated_at = NOW();

-- 4. Vérification des données créées
SELECT 'PROFILES' as table_name, user_id, tenant_id, role, full_name FROM profiles WHERE user_id = 'ebb4c3fe-6288-41df-972d-4a6f32ed813d'
UNION ALL
SELECT 'USER_ROLES' as table_name, ur.user_id, ur.tenant_id, r.name as role, CAST(ur.is_active as TEXT) as status 
FROM user_roles ur 
JOIN roles r ON ur.role_id = r.id 
WHERE ur.user_id = 'ebb4c3fe-6288-41df-972d-4a6f32ed813d'::UUID AND ur.is_active = true
UNION ALL
SELECT 'EMPLOYEES' as table_name, user_id, tenant_id, status, full_name FROM employees WHERE user_id = 'ebb4c3fe-6288-41df-972d-4a6f32ed813d';

-- 5. Créer quelques données de test pour valider l'accès

-- Créer un département de test
INSERT INTO departments (
    name,
    description,
    tenant_id,
    created_at,
    updated_at
) VALUES (
    'Administration',
    'Département administratif principal',
    '878c5ac9-4e99-4baf-803a-14f8ac964ec4',
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Créer un projet de test
INSERT INTO projects (
    name,
    description,
    status,
    priority,
    tenant_id,
    manager_id,
    start_date,
    created_at,
    updated_at
) VALUES (
    'Projet Test Admin',
    'Projet de test pour valider les permissions admin',
    'active',
    'high',
    '878c5ac9-4e99-4baf-803a-14f8ac964ec4',
    'ebb4c3fe-6288-41df-972d-4a6f32ed813d',
    CURRENT_DATE,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Récupérer l'ID de l'employé créé pour les tâches
DO $$
DECLARE
    employee_id_var UUID;
BEGIN
    -- Récupérer l'ID de l'employé
    SELECT id INTO employee_id_var FROM employees WHERE user_id = 'ebb4c3fe-6288-41df-972d-4a6f32ed813d';
    
    -- Créer quelques tâches de test avec l'ID employé correct
    INSERT INTO tasks (
        title,
        description,
        status,
        priority,
        tenant_id,
        assignee_id,
        assigned_name,
        start_date,
        due_date,
        effort_estimate_h,
        progress,
        task_level,
        display_order,
        created_at,
        updated_at
    ) VALUES 
    (
        'Configuration initiale du système',
        'Tâche de configuration initiale pour tester les permissions',
        'todo',
        'high',
        '878c5ac9-4e99-4baf-803a-14f8ac964ec4',
        employee_id_var,
        'Administrateur Wadashaqeen',
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '7 days',
        8,
        0,
        1,
        '1',
        NOW(),
        NOW()
    ),
    (
        'Test des fonctionnalités RH',
        'Validation du module RH après configuration',
        'todo',
        'medium',
        '878c5ac9-4e99-4baf-803a-14f8ac964ec4',
        employee_id_var,
        'Administrateur Wadashaqeen',
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '5 days',
        4,
        0,
        1,
        '2',
        NOW(),
        NOW()
    ) ON CONFLICT DO NOTHING;
END $$;

-- Message de confirmation
SELECT 'Configuration terminée! Utilisateur configuré comme admin du tenant 878c5ac9-4e99-4baf-803a-14f8ac964ec4' as message;
