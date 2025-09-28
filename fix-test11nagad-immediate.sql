-- Correction immédiate pour test11nagad@yahoo.com
-- Utilisateur connecté mais profil manquant (HTTP 406)

-- 1. Vérifier l'état actuel de l'utilisateur
SELECT 
  '=== UTILISATEUR TEST11NAGAD ===' as section,
  id as user_id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'test11nagad@yahoo.com';

-- 2. Vérifier s'il y a une invitation
SELECT 
  '=== INVITATION TEST11NAGAD ===' as section,
  id,
  email,
  full_name,
  tenant_id,
  invitation_type,
  status,
  expires_at
FROM public.invitations 
WHERE email = 'test11nagad@yahoo.com';

-- 3. Créer une invitation si elle n'existe pas
INSERT INTO public.invitations (
  email,
  invitation_type,
  status,
  full_name,
  expires_at,
  metadata
) VALUES (
  'test11nagad@yahoo.com',
  'tenant_owner',
  'pending',
  'Test Nagad User',
  now() + interval '7 days',
  '{"company_name": "Test Nagad Company"}'::jsonb
)
ON CONFLICT (email, invitation_type) DO UPDATE SET
  status = 'pending',
  expires_at = now() + interval '7 days';

-- 4. Exécuter la fonction de réparation globale
DO $$
DECLARE
  user_record RECORD;
  invitation_data RECORD;
  tenant_admin_role_id UUID;
  new_tenant_id UUID;
  new_employee_id TEXT;
  company_name TEXT;
  user_full_name TEXT;
  permission_record RECORD;
BEGIN
  -- Récupérer l'utilisateur
  SELECT * INTO user_record 
  FROM auth.users 
  WHERE email = 'test11nagad@yahoo.com';
  
  IF user_record.id IS NULL THEN
    RAISE NOTICE 'ERREUR: Utilisateur test11nagad@yahoo.com non trouvé';
    RETURN;
  END IF;
  
  RAISE NOTICE '🚀 DÉBUT RÉPARATION pour % (ID: %)', user_record.email, user_record.id;
  
  -- Extraire le nom complet
  user_full_name := COALESCE(
    user_record.raw_user_meta_data->>'full_name',
    'Test Nagad User'
  );
  
  -- Récupérer l'invitation
  SELECT * INTO invitation_data 
  FROM public.invitations 
  WHERE email = user_record.email 
    AND invitation_type = 'tenant_owner'
  ORDER BY created_at DESC 
  LIMIT 1;
  
  company_name := COALESCE(
    invitation_data.metadata->>'company_name',
    'Test Nagad Company'
  );
  
  -- Créer/récupérer tenant
  IF invitation_data.tenant_id IS NOT NULL THEN
    new_tenant_id := invitation_data.tenant_id;
    IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = new_tenant_id) THEN
      INSERT INTO public.tenants (id, name, created_by)
      VALUES (new_tenant_id, company_name, user_record.id);
      RAISE NOTICE '🏢 Tenant créé avec UUID: %', new_tenant_id;
    END IF;
  ELSE
    INSERT INTO public.tenants (name, created_by)
    VALUES (company_name, user_record.id)
    RETURNING id INTO new_tenant_id;
    
    UPDATE public.invitations 
    SET tenant_id = new_tenant_id
    WHERE id = invitation_data.id;
    
    RAISE NOTICE '🏢 Nouveau tenant créé: %', new_tenant_id;
  END IF;
  
  -- Créer le profil
  INSERT INTO public.profiles (
    user_id,
    email,
    full_name,
    tenant_id,
    role
  ) VALUES (
    user_record.id,
    user_record.email,
    user_full_name,
    new_tenant_id,
    'tenant_owner'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    tenant_id = EXCLUDED.tenant_id,
    role = EXCLUDED.role;
  
  RAISE NOTICE '👤 Profil créé pour %', user_record.email;
  
  -- Créer/récupérer rôle tenant_admin
  SELECT id INTO tenant_admin_role_id 
  FROM public.roles 
  WHERE name = 'tenant_admin';
  
  IF tenant_admin_role_id IS NULL THEN
    INSERT INTO public.roles (name, description) 
    VALUES ('tenant_admin', 'Administrateur de tenant')
    RETURNING id INTO tenant_admin_role_id;
    RAISE NOTICE '🔑 Rôle tenant_admin créé: %', tenant_admin_role_id;
  END IF;
  
  -- Créer permissions de base
  INSERT INTO public.permissions (name, description) VALUES
    ('manage_employees', 'Gérer les employés'),
    ('manage_projects', 'Gérer les projets'),
    ('manage_tasks', 'Gérer les tâches'),
    ('view_reports', 'Voir les rapports'),
    ('manage_settings', 'Gérer les paramètres')
  ON CONFLICT (name) DO NOTHING;
  
  -- Attribuer permissions au rôle
  FOR permission_record IN 
    SELECT id FROM public.permissions 
    WHERE name IN ('manage_employees', 'manage_projects', 'manage_tasks', 'view_reports', 'manage_settings')
  LOOP
    INSERT INTO public.role_permissions (role_id, permission_id)
    VALUES (tenant_admin_role_id, permission_record.id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END LOOP;
  
  RAISE NOTICE '🔐 Permissions attribuées';
  
  -- Assigner rôle à l'utilisateur
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (user_record.id, tenant_admin_role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;
  
  RAISE NOTICE '👥 Rôle assigné';
  
  -- Créer employé
  SELECT 'EMP' || LPAD((COALESCE(MAX(CAST(SUBSTRING(employee_id FROM 4) AS INTEGER)), 0) + 1)::TEXT, 3, '0')
  INTO new_employee_id
  FROM public.employees 
  WHERE employee_id ~ '^EMP[0-9]+$';
  
  INSERT INTO public.employees (
    employee_id,
    email,
    full_name,
    user_id,
    tenant_id
  ) VALUES (
    new_employee_id,
    user_record.email,
    user_full_name,
    user_record.id,
    new_tenant_id
  )
  ON CONFLICT (user_id) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    tenant_id = EXCLUDED.tenant_id;
  
  RAISE NOTICE '👷 Employé créé: %', new_employee_id;
  
  -- Mettre à jour invitation
  UPDATE public.invitations 
  SET status = 'accepted', 
      accepted_at = now()
  WHERE id = invitation_data.id;
  
  RAISE NOTICE '📬 Invitation acceptée';
  RAISE NOTICE '🎉 RÉPARATION TERMINÉE pour %', user_record.email;
  
END $$;

-- 5. Vérifier les résultats
SELECT pg_sleep(1);

-- 6. Vérification finale
SELECT 
  '=== RÉSULTATS APRÈS RÉPARATION ===' as section,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.profiles WHERE email = 'test11nagad@yahoo.com') THEN '✅ Profil créé'
    ELSE '❌ Profil manquant'
  END as profil_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.employees WHERE email = 'test11nagad@yahoo.com') THEN '✅ Employé créé'
    ELSE '❌ Employé manquant'
  END as employee_status;

-- 7. Détails du profil créé
SELECT 
  '=== DÉTAILS PROFIL ===' as section,
  id,
  user_id,
  email,
  full_name,
  tenant_id,
  role,
  created_at
FROM public.profiles 
WHERE email = 'test11nagad@yahoo.com';

-- 8. Instructions
SELECT 
  '=== INSTRUCTIONS ===' as section,
  'L''utilisateur peut maintenant rafraîchir son navigateur' as message
UNION ALL
SELECT 
  '=== INSTRUCTIONS ===' as section,
  'Le profil devrait être accessible et l''erreur HTTP 406 résolue' as message;
