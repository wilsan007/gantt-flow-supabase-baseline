-- Script de diagnostic pour complete-auto-tenant-system.sql
-- Vérifier les erreurs d'installation et de fonctionnement

-- 1. Vérifier si les fonctions ont été créées correctement
SELECT 
  '=== FONCTIONS INSTALLÉES ===' as section,
  proname as function_name,
  pronargs as num_args,
  prorettype::regtype as return_type
FROM pg_proc 
WHERE proname IN ('auto_create_complete_tenant_owner', 'repair_incomplete_users')
ORDER BY proname;

-- 2. Vérifier si les triggers sont installés
SELECT 
  '=== TRIGGERS INSTALLÉS ===' as section,
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled
FROM pg_trigger 
WHERE tgname LIKE '%auto_tenant%'
ORDER BY tgname;

-- 3. Tester la fonction repair_incomplete_users directement
DO $$
DECLARE
  error_msg TEXT;
BEGIN
  BEGIN
    RAISE NOTICE 'Test de la fonction repair_incomplete_users...';
    PERFORM repair_incomplete_users();
    RAISE NOTICE 'SUCCESS: Fonction repair_incomplete_users exécutée sans erreur';
  EXCEPTION
    WHEN OTHERS THEN
      error_msg := SQLERRM;
      RAISE NOTICE 'ERREUR dans repair_incomplete_users: %', error_msg;
      RAISE NOTICE 'Code erreur: %', SQLSTATE;
  END;
END $$;

-- 4. Vérifier les dépendances - tables requises
SELECT 
  '=== TABLES REQUISES ===' as section,
  table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t.table_name) 
    THEN '✅ Existe'
    ELSE '❌ Manquante'
  END as status
FROM (VALUES 
  ('invitations'),
  ('profiles'), 
  ('tenants'),
  ('employees'),
  ('roles'),
  ('user_roles'),
  ('role_permissions'),
  ('permissions')
) AS t(table_name);

-- 5. Vérifier les colonnes critiques dans les tables
SELECT 
  '=== COLONNES INVITATIONS ===' as section,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'invitations'
  AND column_name IN ('email', 'tenant_id', 'status', 'invitation_type', 'full_name')
ORDER BY column_name;

SELECT 
  '=== COLONNES PROFILES ===' as section,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles'
  AND column_name IN ('email', 'tenant_id', 'user_id', 'full_name', 'role')
ORDER BY column_name;

-- 6. Vérifier les contraintes et clés étrangères
SELECT 
  '=== CONTRAINTES EMPLOYEES ===' as section,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'employees'
  AND constraint_type IN ('FOREIGN KEY', 'UNIQUE')
ORDER BY constraint_name;

-- 7. Tester la création d'un tenant admin role
DO $$
DECLARE
  role_count INTEGER;
  error_msg TEXT;
BEGIN
  BEGIN
    SELECT COUNT(*) INTO role_count 
    FROM public.roles 
    WHERE name = 'tenant_admin';
    
    IF role_count = 0 THEN
      RAISE NOTICE 'ATTENTION: Rôle tenant_admin manquant';
      -- Essayer de créer le rôle
      INSERT INTO public.roles (name, description) 
      VALUES ('tenant_admin', 'Administrateur de tenant')
      ON CONFLICT (name) DO NOTHING;
      RAISE NOTICE 'SUCCESS: Rôle tenant_admin créé';
    ELSE
      RAISE NOTICE 'SUCCESS: Rôle tenant_admin existe (% entrées)', role_count;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      error_msg := SQLERRM;
      RAISE NOTICE 'ERREUR lors de la vérification du rôle: %', error_msg;
  END;
END $$;

-- 8. Vérifier les permissions pour tenant_admin
SELECT 
  '=== PERMISSIONS TENANT_ADMIN ===' as section,
  COUNT(*) as permission_count
FROM public.role_permissions rp
JOIN public.roles r ON rp.role_id = r.id
WHERE r.name = 'tenant_admin';

-- 9. Tester la génération d'employee_id
DO $$
DECLARE
  next_employee_id TEXT;
  error_msg TEXT;
BEGIN
  BEGIN
    -- Tester la logique de génération d'employee_id
    SELECT 'EMP' || LPAD((COALESCE(MAX(CAST(SUBSTRING(employee_id FROM 4) AS INTEGER)), 0) + 1)::TEXT, 3, '0')
    INTO next_employee_id
    FROM public.employees 
    WHERE employee_id ~ '^EMP[0-9]+$';
    
    RAISE NOTICE 'SUCCESS: Prochain employee_id sera: %', next_employee_id;
  EXCEPTION
    WHEN OTHERS THEN
      error_msg := SQLERRM;
      RAISE NOTICE 'ERREUR dans génération employee_id: %', error_msg;
  END;
END $$;

-- 10. Vérifier les utilisateurs existants avec invitations
SELECT 
  '=== UTILISATEURS AVEC INVITATIONS ===' as section,
  u.email,
  i.status as invitation_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.profiles WHERE email = u.email) THEN '✅'
    ELSE '❌'
  END as has_profile,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.employees WHERE email = u.email) THEN '✅'
    ELSE '❌'
  END as has_employee
FROM auth.users u
JOIN public.invitations i ON u.email = i.email
WHERE i.invitation_type = 'tenant_owner'
ORDER BY u.created_at DESC
LIMIT 5;

-- 11. Résumé des problèmes détectés
SELECT 
  '=== RÉSUMÉ DIAGNOSTIC ===' as section,
  'Vérifiez les NOTICES ci-dessus pour identifier les erreurs spécifiques' as message
UNION ALL
SELECT 
  '=== RÉSUMÉ DIAGNOSTIC ===' as section,
  'Les erreurs communes: rôles manquants, contraintes FK, colonnes manquantes' as message;
