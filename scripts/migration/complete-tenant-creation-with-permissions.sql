-- Version complète avec gestion des permissions et role_permissions
-- Inclut toutes les tables demandées par l'utilisateur

CREATE OR REPLACE FUNCTION debug_tenant_creation(user_email TEXT)
RETURNS JSON AS $$
DECLARE
  user_record RECORD;
  invitation_data RECORD;
  tenant_admin_role_id UUID;
  created_employee_id UUID;
  employee_id_counter INTEGER;
  generated_employee_id TEXT;
  company_name TEXT;
  permission_record RECORD;
  debug_log TEXT := '';
BEGIN
  debug_log := debug_log || '🔍 DÉBUT DEBUG TENANT CREATION COMPLET pour: ' || user_email || E'\n';

  -- 1. Vérifier l'utilisateur dans auth.users
  debug_log := debug_log || '1️⃣ Recherche utilisateur dans auth.users...' || E'\n';
  
  SELECT * INTO user_record
  FROM auth.users
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    debug_log := debug_log || '❌ ERREUR: Utilisateur non trouvé dans auth.users' || E'\n';
    RAISE NOTICE '%', debug_log;
    RETURN json_build_object('success', false, 'error', 'Utilisateur non trouvé', 'debug_log', debug_log);
  END IF;

  debug_log := debug_log || '✅ Utilisateur trouvé: ' || user_record.id || E'\n';

  -- 2. Vérifier si profil existe déjà
  debug_log := debug_log || '2️⃣ Vérification profil existant...' || E'\n';
  
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = user_record.id) THEN
    debug_log := debug_log || '❌ ERREUR: Profil existe déjà' || E'\n';
    RAISE NOTICE '%', debug_log;
    RETURN json_build_object('success', false, 'error', 'Profil existe déjà', 'debug_log', debug_log);
  END IF;

  debug_log := debug_log || '✅ Aucun profil existant' || E'\n';

  -- 3. Rechercher invitation
  debug_log := debug_log || '3️⃣ Recherche invitation...' || E'\n';
  
  SELECT * INTO invitation_data
  FROM public.invitations
  WHERE email = user_email
    AND status = 'pending'
    AND expires_at > now()
    AND invitation_type = 'tenant_owner';
    
  IF NOT FOUND THEN
    debug_log := debug_log || '❌ ERREUR: Aucune invitation tenant_owner valide trouvée' || E'\n';
    RAISE NOTICE '%', debug_log;
    RETURN json_build_object('success', false, 'error', 'Aucune invitation valide', 'debug_log', debug_log);
  END IF;

  debug_log := debug_log || '✅ Invitation trouvée: ' || invitation_data.id || E'\n';

  -- 4. Vérifier/créer rôle tenant_admin avec permissions
  debug_log := debug_log || '4️⃣ Vérification/création rôle tenant_admin...' || E'\n';
  
  SELECT id INTO tenant_admin_role_id
  FROM public.roles
  WHERE name = 'tenant_admin';
  
  IF tenant_admin_role_id IS NULL THEN
    debug_log := debug_log || '⚠️ Rôle tenant_admin non trouvé, création...' || E'\n';
    
    BEGIN
      INSERT INTO public.roles (name, description, created_at, updated_at)
      VALUES ('tenant_admin', 'Administrateur de tenant', now(), now())
      RETURNING id INTO tenant_admin_role_id;
      
      debug_log := debug_log || '✅ Rôle tenant_admin créé: ' || tenant_admin_role_id || E'\n';
    EXCEPTION
      WHEN OTHERS THEN
        debug_log := debug_log || '❌ ERREUR création rôle: ' || SQLERRM || E'\n';
        RAISE NOTICE '%', debug_log;
        RETURN json_build_object('success', false, 'error', 'Erreur création rôle: ' || SQLERRM, 'debug_log', debug_log);
    END;
  ELSE
    debug_log := debug_log || '✅ Rôle tenant_admin existant: ' || tenant_admin_role_id || E'\n';
  END IF;

  -- 5. Assigner permissions au rôle tenant_admin
  debug_log := debug_log || '5️⃣ Attribution permissions tenant_admin...' || E'\n';
  
  BEGIN
    -- Permissions essentielles pour tenant_admin
    FOR permission_record IN 
      SELECT id, name FROM public.permissions 
      WHERE name IN (
        'admin_all', 'roles_manage', 'user_roles_assign',
        'employees_create', 'employees_read', 'employees_update', 'employees_delete',
        'projects_create', 'projects_read', 'projects_update', 'projects_delete',
        'tasks_create', 'tasks_read', 'tasks_update', 'tasks_delete',
        'leave_manage', 'expense_manage', 'payroll_manage'
      )
    LOOP
      -- Insérer dans role_permissions si pas déjà présent
      INSERT INTO public.role_permissions (role_id, permission_id, created_at)
      VALUES (tenant_admin_role_id, permission_record.id, now())
      ON CONFLICT (role_id, permission_id) DO NOTHING;
      
      debug_log := debug_log || '  ✅ Permission assignée: ' || permission_record.name || E'\n';
    END LOOP;
    
    debug_log := debug_log || '✅ Permissions tenant_admin configurées' || E'\n';
  EXCEPTION
    WHEN OTHERS THEN
      debug_log := debug_log || '❌ ERREUR attribution permissions: ' || SQLERRM || E'\n';
      RAISE NOTICE '%', debug_log;
      RETURN json_build_object('success', false, 'error', 'Erreur permissions: ' || SQLERRM, 'debug_log', debug_log);
  END;

  -- 6. Préparer nom entreprise
  debug_log := debug_log || '6️⃣ Préparation nom entreprise...' || E'\n';
  
  company_name := COALESCE(
    invitation_data.metadata->>'company_name',
    invitation_data.full_name || ' Company'
  );
  
  debug_log := debug_log || '✅ Nom entreprise: ' || company_name || E'\n';

  -- 7. Créer le tenant
  debug_log := debug_log || '7️⃣ Création tenant...' || E'\n';
  
  BEGIN
    INSERT INTO public.tenants (
      id,
      name,
      status,
      created_at,
      updated_at
    ) VALUES (
      invitation_data.tenant_id,
      company_name,
      'active',
      now(),
      now()
    );
    
    debug_log := debug_log || '✅ Tenant créé avec succès' || E'\n';
  EXCEPTION
    WHEN OTHERS THEN
      debug_log := debug_log || '❌ ERREUR création tenant: ' || SQLERRM || E'\n';
      RAISE NOTICE '%', debug_log;
      RETURN json_build_object('success', false, 'error', 'Erreur création tenant: ' || SQLERRM, 'debug_log', debug_log);
  END;

  -- 8. Créer le profil (OBLIGATOIRE AVANT EMPLOYÉ)
  debug_log := debug_log || '8️⃣ Création profil tenant_admin...' || E'\n';
  
  BEGIN
    INSERT INTO public.profiles (
      user_id,
      tenant_id,
      full_name,
      email,
      role,
      created_at,
      updated_at
    ) VALUES (
      user_record.id,
      invitation_data.tenant_id,
      COALESCE(user_record.raw_user_meta_data->>'full_name', invitation_data.full_name),
      user_record.email,
      'tenant_admin',
      now(),
      now()
    );
    
    debug_log := debug_log || '✅ Profil tenant_admin créé' || E'\n';
  EXCEPTION
    WHEN OTHERS THEN
      debug_log := debug_log || '❌ ERREUR création profil: ' || SQLERRM || E'\n';
      RAISE NOTICE '%', debug_log;
      RETURN json_build_object('success', false, 'error', 'Erreur création profil: ' || SQLERRM, 'debug_log', debug_log);
  END;

  -- 9. Créer user_roles (tenant_admin)
  debug_log := debug_log || '9️⃣ Création user_roles tenant_admin...' || E'\n';
  
  BEGIN
    INSERT INTO public.user_roles (
      user_id,
      role_id,
      tenant_id,
      is_active,
      created_at
    ) VALUES (
      user_record.id,
      tenant_admin_role_id,
      invitation_data.tenant_id,
      true,
      now()
    );
    
    debug_log := debug_log || '✅ User_roles tenant_admin créé' || E'\n';
  EXCEPTION
    WHEN OTHERS THEN
      debug_log := debug_log || '❌ ERREUR création user_roles: ' || SQLERRM || E'\n';
      RAISE NOTICE '%', debug_log;
      RETURN json_build_object('success', false, 'error', 'Erreur création user_roles: ' || SQLERRM, 'debug_log', debug_log);
  END;

  -- 10. Générer employee_id unique
  debug_log := debug_log || '🔟 Génération employee_id...' || E'\n';
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id FROM 4) AS INTEGER)), 0) + 1
  INTO employee_id_counter
  FROM public.employees 
  WHERE employee_id ~ '^EMP[0-9]+$';
  
  generated_employee_id := 'EMP' || LPAD(employee_id_counter::TEXT, 3, '0');
  debug_log := debug_log || '✅ Employee ID généré: ' || generated_employee_id || E'\n';

  -- 11. Créer employé tenant administrateur
  debug_log := debug_log || '1️⃣1️⃣ Création employé tenant administrateur...' || E'\n';
  
  BEGIN
    INSERT INTO public.employees (
      user_id,
      employee_id,
      full_name,
      email,
      job_title,
      hire_date,
      contract_type,
      status,
      tenant_id,
      created_at,
      updated_at
    ) VALUES (
      user_record.id,
      generated_employee_id,
      COALESCE(user_record.raw_user_meta_data->>'full_name', invitation_data.full_name),
      user_record.email,
      'Tenant Administrateur',
      CURRENT_DATE,
      'CDI',
      'active',
      invitation_data.tenant_id,
      now(),
      now()
    ) RETURNING id INTO created_employee_id;
    
    debug_log := debug_log || '✅ Employé tenant administrateur créé: ' || created_employee_id || E'\n';
  EXCEPTION
    WHEN OTHERS THEN
      debug_log := debug_log || '❌ ERREUR création employé: ' || SQLERRM || E'\n';
      RAISE NOTICE '%', debug_log;
      RETURN json_build_object('success', false, 'error', 'Erreur création employé: ' || SQLERRM, 'debug_log', debug_log);
  END;

  -- 12. Marquer invitation comme acceptée
  debug_log := debug_log || '1️⃣2️⃣ Mise à jour invitation...' || E'\n';
  
  BEGIN
    UPDATE public.invitations
    SET 
      status = 'accepted',
      accepted_at = now(),
      metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{completed_by}',
        to_jsonb(user_record.id)
      )
    WHERE id = invitation_data.id;
    
    debug_log := debug_log || '✅ Invitation marquée comme acceptée' || E'\n';
  EXCEPTION
    WHEN OTHERS THEN
      debug_log := debug_log || '❌ ERREUR mise à jour invitation: ' || SQLERRM || E'\n';
      RAISE NOTICE '%', debug_log;
      RETURN json_build_object('success', false, 'error', 'Erreur mise à jour invitation: ' || SQLERRM, 'debug_log', debug_log);
  END;

  debug_log := debug_log || '🎉 SUCCÈS COMPLET AVEC PERMISSIONS!' || E'\n';
  RAISE NOTICE '%', debug_log;

  RETURN json_build_object(
    'success', true,
    'message', 'Tenant owner créé avec succès (complet avec permissions)',
    'user_id', user_record.id,
    'tenant_id', invitation_data.tenant_id,
    'tenant_name', company_name,
    'role_id', tenant_admin_role_id,
    'employee_id', generated_employee_id,
    'employee_record_id', created_employee_id,
    'debug_log', debug_log
  );

EXCEPTION
  WHEN OTHERS THEN
    debug_log := debug_log || '💥 ERREUR GÉNÉRALE: ' || SQLERRM || E'\n';
    RAISE NOTICE '%', debug_log;
    RETURN json_build_object(
      'success', false, 
      'error', 'Erreur générale: ' || SQLERRM,
      'debug_log', debug_log
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION debug_tenant_creation TO authenticated;
GRANT EXECUTE ON FUNCTION debug_tenant_creation TO anon;

COMMENT ON FUNCTION debug_tenant_creation IS 'Version complète incluant permissions et role_permissions pour tenant_admin';
