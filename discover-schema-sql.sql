-- DÉCOUVERTE AUTOMATIQUE DU SCHÉMA
-- À exécuter dans Supabase Dashboard > SQL Editor

-- 1. Trouver les tables candidates par similarité de nom
SELECT 
  table_schema, 
  table_name,
  CASE 
    WHEN table_name ILIKE '%invitation%' THEN 'invitations_table'
    WHEN table_name ILIKE '%tenant%' THEN 'tenants_table'
    WHEN table_name ILIKE '%profile%' THEN 'profiles_table'
    WHEN table_name ILIKE '%employee%' THEN 'employees_table'
    WHEN table_name = 'roles' OR (table_name ILIKE '%role%' AND table_name NOT ILIKE '%user%' AND table_name NOT ILIKE '%permission%') THEN 'roles_table'
    WHEN table_name ILIKE '%permission%' AND table_name NOT ILIKE '%role%' THEN 'permissions_table'
    WHEN table_name ILIKE '%role_permission%' OR table_name ILIKE '%permission_role%' THEN 'role_permissions_table'
    WHEN table_name ILIKE '%user_role%' OR table_name ILIKE '%role_user%' THEN 'user_roles_table'
    ELSE 'unknown'
  END as table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND (
    table_name ILIKE '%invitation%' OR
    table_name ILIKE '%tenant%' OR
    table_name ILIKE '%profile%' OR
    table_name ILIKE '%employee%' OR
    table_name ILIKE '%role%' OR
    table_name ILIKE '%permission%' OR
    table_name ILIKE '%user_role%'
  )
ORDER BY table_name;

-- 2. Inspecter colonnes des tables principales (adapter les noms selon résultat ci-dessus)
SELECT 
  'INVITATIONS' as section,
  table_name, 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name ILIKE '%invitation%'
ORDER BY table_name, ordinal_position;

SELECT 
  'TENANTS' as section,
  table_name, 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name ILIKE '%tenant%'
ORDER BY table_name, ordinal_position;

SELECT 
  'PROFILES' as section,
  table_name, 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name ILIKE '%profile%'
ORDER BY table_name, ordinal_position;

SELECT 
  'ROLES' as section,
  table_name, 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (table_name = 'roles' OR table_name ILIKE '%role%')
  AND table_name NOT ILIKE '%user_role%'
  AND table_name NOT ILIKE '%role_permission%'
ORDER BY table_name, ordinal_position;

SELECT 
  'USER_ROLES' as section,
  table_name, 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (table_name ILIKE '%user_role%' OR table_name ILIKE '%role_user%')
ORDER BY table_name, ordinal_position;

SELECT 
  'EMPLOYEES' as section,
  table_name, 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name ILIKE '%employee%'
ORDER BY table_name, ordinal_position;
