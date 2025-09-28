-- SYSTÈME AUTOMATIQUE COMPLET DE CRÉATION TENANT
-- Solution définitive pour tous les utilisateurs avec données complètes
-- COPIE EXACTE de la fonction debug_tenant_creation du fichier complete-tenant-creation-with-permissions.sql
-- Testée et validée avec test-complete-tenant-creation.js

-- 1. FONCTION PRINCIPALE : Auto-création complète tenant owner
-- Adaptée de debug_tenant_creation pour fonctionner comme trigger
CREATE OR REPLACE FUNCTION auto_create_complete_tenant_owner()
RETURNS TRIGGER AS $$
DECLARE
  invitation_data RECORD;
  tenant_admin_role_id UUID;
  created_employee_id UUID;
  employee_id_counter INTEGER;
  generated_employee_id TEXT;
  company_name TEXT;
  permission_record RECORD;
  debug_log TEXT := '';
BEGIN
  debug_log := debug_log || '🔍 DÉBUT DEBUG TENANT CREATION COMPLET pour: ' || NEW.email || E'\n';

  -- 1. Utilisateur déjà disponible dans NEW (pas besoin de recherche)
  debug_log := debug_log || '1️⃣ Utilisateur trouvé: ' || NEW.id || E'\n';

  -- 2. Vérifier si profil existe déjà
  debug_log := debug_log || '2️⃣ Vérification profil existant...' || E'\n';
  
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id) THEN
    debug_log := debug_log || '❌ ERREUR: Profil existe déjà' || E'\n';
    RAISE NOTICE '%', debug_log;
    RETURN NEW;
  END IF;

  debug_log := debug_log || '✅ Aucun profil existant' || E'\n';

  -- 3. Rechercher invitation
  debug_log := debug_log || '3️⃣ Recherche invitation...' || E'\n';
  
  SELECT * INTO invitation_data
  FROM public.invitations
  WHERE email = NEW.email
    AND status = 'pending'
    AND expires_at > now()
    AND invitation_type = 'tenant_owner';
    
  IF NOT FOUND THEN
    debug_log := debug_log || '❌ ERREUR: Aucune invitation tenant_owner valide trouvée' || E'\n';
    RAISE NOTICE '%', debug_log;
    RETURN NEW;
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
        RETURN NEW;
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
      RETURN NEW;
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
      RETURN NEW;
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
      NEW.id,
      invitation_data.tenant_id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', invitation_data.full_name),
      NEW.email,
      'tenant_admin',
      now(),
      now()
    );
    
    debug_log := debug_log || '✅ Profil tenant_admin créé' || E'\n';
  EXCEPTION
    WHEN OTHERS THEN
      debug_log := debug_log || '❌ ERREUR création profil: ' || SQLERRM || E'\n';
      RAISE NOTICE '%', debug_log;
      RETURN NEW;
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
      NEW.id,
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
      RETURN NEW;
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
      NEW.id,
      generated_employee_id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', invitation_data.full_name),
      NEW.email,
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
      RETURN NEW;
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
        to_jsonb(NEW.id)
      )
    WHERE id = invitation_data.id;
    
    debug_log := debug_log || '✅ Invitation marquée comme acceptée' || E'\n';
  EXCEPTION
    WHEN OTHERS THEN
      debug_log := debug_log || '❌ ERREUR mise à jour invitation: ' || SQLERRM || E'\n';
      RAISE NOTICE '%', debug_log;
      RETURN NEW;
  END;

  debug_log := debug_log || '🎉 SUCCÈS COMPLET AVEC PERMISSIONS!' || E'\n';
  RAISE NOTICE '%', debug_log;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    debug_log := debug_log || '💥 ERREUR GÉNÉRALE: ' || SQLERRM || E'\n';
    RAISE NOTICE '%', debug_log;
    -- Log de l'erreur mais ne pas bloquer la connexion
    RAISE WARNING 'Erreur auto-création tenant owner: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. FONCTION DE RÉPARATION pour utilisateurs existants incomplets
CREATE OR REPLACE FUNCTION repair_incomplete_users()
RETURNS JSON AS $$
DECLARE
  user_record RECORD;
  repaired_count INTEGER := 0;
  error_count INTEGER := 0;
  repair_log TEXT := '';
  result_details JSONB := '[]'::jsonb;
BEGIN
  repair_log := repair_log || '🔧 DÉBUT RÉPARATION UTILISATEURS INCOMPLETS' || E'\n';

  -- Trouver tous les utilisateurs dans auth.users qui n'ont pas de profil
  -- mais qui ont une invitation tenant_owner valide
  FOR user_record IN
    SELECT DISTINCT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    WHERE NOT EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
    )
    AND EXISTS (
      SELECT 1 FROM public.invitations i 
      WHERE i.email = u.email 
        AND i.status = 'pending'
        AND i.expires_at > now()
        AND i.invitation_type = 'tenant_owner'
    )
  LOOP
    repair_log := repair_log || '🔍 Réparation utilisateur: ' || user_record.email || E'\n';
    
    BEGIN
      -- Simuler un trigger INSERT pour cet utilisateur
      PERFORM auto_create_complete_tenant_owner_for_existing(user_record.id, user_record.email, user_record.raw_user_meta_data);
      
      repaired_count := repaired_count + 1;
      repair_log := repair_log || '✅ Utilisateur réparé: ' || user_record.email || E'\n';
      
      -- Ajouter aux détails du résultat
      result_details := result_details || jsonb_build_object(
        'user_id', user_record.id,
        'email', user_record.email,
        'status', 'repaired'
      );
      
    EXCEPTION
      WHEN OTHERS THEN
        error_count := error_count + 1;
        repair_log := repair_log || '❌ Erreur réparation ' || user_record.email || ': ' || SQLERRM || E'\n';
        
        -- Ajouter aux détails du résultat
        result_details := result_details || jsonb_build_object(
          'user_id', user_record.id,
          'email', user_record.email,
          'status', 'error',
          'error', SQLERRM
        );
    END;
  END LOOP;

  repair_log := repair_log || '🎯 RÉSULTAT RÉPARATION: ' || repaired_count || ' réparés, ' || error_count || ' erreurs' || E'\n';
  RAISE NOTICE '%', repair_log;

  RETURN json_build_object(
    'success', true,
    'repaired_count', repaired_count,
    'error_count', error_count,
    'repair_log', repair_log,
    'details', result_details
  );

EXCEPTION
  WHEN OTHERS THEN
    repair_log := repair_log || '💥 ERREUR GÉNÉRALE RÉPARATION: ' || SQLERRM || E'\n';
    RAISE NOTICE '%', repair_log;
    RETURN json_build_object(
      'success', false,
      'error', 'Erreur générale: ' || SQLERRM,
      'repair_log', repair_log
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. FONCTION AUXILIAIRE pour réparation utilisateurs existants
CREATE OR REPLACE FUNCTION auto_create_complete_tenant_owner_for_existing(
  user_id UUID,
  user_email TEXT,
  user_metadata JSONB
)
RETURNS VOID AS $$
DECLARE
  invitation_data RECORD;
  tenant_admin_role_id UUID;
  created_employee_id UUID;
  employee_id_counter INTEGER;
  generated_employee_id TEXT;
  company_name TEXT;
  permission_record RECORD;
BEGIN
  -- Chercher une invitation en attente pour cet email
  SELECT * INTO invitation_data
  FROM public.invitations
  WHERE email = user_email
    AND status = 'pending'
    AND expires_at > now()
    AND invitation_type = 'tenant_owner';
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aucune invitation tenant_owner valide pour %', user_email;
  END IF;

  -- Vérifier/créer rôle tenant_admin
  SELECT id INTO tenant_admin_role_id
  FROM public.roles
  WHERE name = 'tenant_admin';
  
  IF tenant_admin_role_id IS NULL THEN
    INSERT INTO public.roles (name, description, created_at, updated_at)
    VALUES ('tenant_admin', 'Administrateur de tenant', now(), now())
    RETURNING id INTO tenant_admin_role_id;
  END IF;

  -- Assigner permissions au rôle tenant_admin
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
    INSERT INTO public.role_permissions (role_id, permission_id, created_at)
    VALUES (tenant_admin_role_id, permission_record.id, now())
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END LOOP;

  -- Préparer nom entreprise
  company_name := COALESCE(
    invitation_data.metadata->>'company_name',
    invitation_data.full_name || ' Company'
  );

  -- Créer le tenant
  INSERT INTO public.tenants (
    id, name, status, created_at, updated_at
  ) VALUES (
    invitation_data.tenant_id, company_name, 'active', now(), now()
  );

  -- Créer le profil
  INSERT INTO public.profiles (
    user_id, tenant_id, full_name, email, role, created_at, updated_at
  ) VALUES (
    user_id, invitation_data.tenant_id,
    COALESCE(user_metadata->>'full_name', invitation_data.full_name),
    user_email, 'tenant_admin', now(), now()
  );

  -- Créer user_roles
  INSERT INTO public.user_roles (
    user_id, role_id, tenant_id, is_active, created_at
  ) VALUES (
    user_id, tenant_admin_role_id, invitation_data.tenant_id, true, now()
  );

  -- Générer employee_id unique
  SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id FROM 4) AS INTEGER)), 0) + 1
  INTO employee_id_counter
  FROM public.employees 
  WHERE employee_id ~ '^EMP[0-9]+$';
  
  generated_employee_id := 'EMP' || LPAD(employee_id_counter::TEXT, 3, '0');

  -- Créer employé
  INSERT INTO public.employees (
    user_id, employee_id, full_name, email, job_title, hire_date,
    contract_type, status, tenant_id, created_at, updated_at
  ) VALUES (
    user_id, generated_employee_id,
    COALESCE(user_metadata->>'full_name', invitation_data.full_name),
    user_email, 'Tenant Administrateur', CURRENT_DATE,
    'CDI', 'active', invitation_data.tenant_id, now(), now()
  );

  -- Marquer invitation comme acceptée
  UPDATE public.invitations
  SET status = 'accepted', accepted_at = now(),
      metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{completed_by}', to_jsonb(user_id))
  WHERE id = invitation_data.id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. REMPLACER LE TRIGGER EXISTANT
DROP TRIGGER IF EXISTS auto_tenant_creation_trigger ON auth.users;

CREATE TRIGGER auto_tenant_creation_trigger_complete
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_complete_tenant_owner();

-- 5. ACCORDER LES PERMISSIONS
GRANT EXECUTE ON FUNCTION auto_create_complete_tenant_owner TO authenticated;
GRANT EXECUTE ON FUNCTION auto_create_complete_tenant_owner TO anon;
GRANT EXECUTE ON FUNCTION repair_incomplete_users TO authenticated;
GRANT EXECUTE ON FUNCTION repair_incomplete_users TO anon;
GRANT EXECUTE ON FUNCTION auto_create_complete_tenant_owner_for_existing TO authenticated;
GRANT EXECUTE ON FUNCTION auto_create_complete_tenant_owner_for_existing TO anon;

-- 6. COMMENTAIRES
COMMENT ON FUNCTION auto_create_complete_tenant_owner IS 'Système automatique complet de création tenant owner avec toutes les données (tenant, profil, rôles, permissions, employé)';
COMMENT ON FUNCTION repair_incomplete_users IS 'Répare automatiquement tous les utilisateurs existants avec données manquantes';
COMMENT ON FUNCTION auto_create_complete_tenant_owner_for_existing IS 'Fonction auxiliaire pour créer tenant complet pour utilisateurs existants';

-- 7. INSTRUCTIONS D'UTILISATION
/*
UTILISATION:

1. NOUVEAU SYSTÈME AUTOMATIQUE:
   - Le trigger se déclenche automatiquement à chaque nouvelle inscription
   - Crée automatiquement: tenant, profil, user_roles, permissions, employé
   - Ordre respecté selon les contraintes de base de données

2. RÉPARATION UTILISATEURS EXISTANTS:
   SELECT repair_incomplete_users();
   
   Cette fonction trouve et répare automatiquement tous les utilisateurs
   qui existent dans auth.users mais n'ont pas de profil/tenant.

3. MONITORING:
   - Tous les logs sont affichés via RAISE NOTICE
   - Les erreurs n'interrompent pas le processus de connexion
   - Résultats détaillés en JSON pour la fonction de réparation

4. SÉCURITÉ:
   - Fonctions avec SECURITY DEFINER
   - Permissions accordées aux utilisateurs authentifiés et anonymes
   - Gestion d'erreurs robuste
*/
