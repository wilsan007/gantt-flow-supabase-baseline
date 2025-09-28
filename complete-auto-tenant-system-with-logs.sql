-- SYSTÈME AUTOMATIQUE COMPLET DE CRÉATION TENANT AVEC LOGS DÉTAILLÉS
-- Version avec traçage complet pour identifier les points de blocage
-- Basé sur debug_tenant_creation avec logs étendus

-- 1. TABLE DE LOGS pour tracer l'exécution
CREATE TABLE IF NOT EXISTS public.trigger_execution_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT,
  user_id UUID,
  step_name TEXT,
  step_number INTEGER,
  status TEXT, -- 'started', 'success', 'error', 'skipped'
  message TEXT,
  error_details TEXT,
  execution_time TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now()
);

-- 2. FONCTION DE LOG
CREATE OR REPLACE FUNCTION log_trigger_step(
  p_user_email TEXT,
  p_user_id UUID,
  p_step_name TEXT,
  p_step_number INTEGER,
  p_status TEXT,
  p_message TEXT,
  p_error_details TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.trigger_execution_logs (
    user_email, user_id, step_name, step_number, status, message, error_details
  ) VALUES (
    p_user_email, p_user_id, p_step_name, p_step_number, p_status, p_message, p_error_details
  );
  
  -- Log aussi dans les notices PostgreSQL
  RAISE NOTICE '[STEP %] % - %: %', p_step_number, p_step_name, p_status, p_message;
  
  IF p_error_details IS NOT NULL THEN
    RAISE NOTICE '[ERROR] %', p_error_details;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. FONCTION PRINCIPALE AVEC LOGS DÉTAILLÉS
CREATE OR REPLACE FUNCTION auto_create_complete_tenant_owner_with_logs()
RETURNS TRIGGER AS $$
DECLARE
  invitation_data RECORD;
  tenant_admin_role_id UUID;
  created_employee_id UUID;
  employee_id_counter INTEGER;
  generated_employee_id TEXT;
  company_name TEXT;
  permission_record RECORD;
  permission_count INTEGER := 0;
  start_time TIMESTAMP := now();
BEGIN
  -- LOG: Début du trigger
  PERFORM log_trigger_step(
    NEW.email, NEW.id, 'TRIGGER_START', 0, 'started',
    'Début exécution trigger pour utilisateur: ' || NEW.email || ' (ID: ' || NEW.id || ')'
  );

  -- ÉTAPE 1: Vérifier si profil existe déjà
  PERFORM log_trigger_step(
    NEW.email, NEW.id, 'CHECK_PROFILE', 1, 'started',
    'Vérification existence profil...'
  );
  
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id) THEN
    PERFORM log_trigger_step(
      NEW.email, NEW.id, 'CHECK_PROFILE', 1, 'skipped',
      'Profil existe déjà - arrêt du processus'
    );
    RETURN NEW;
  END IF;

  PERFORM log_trigger_step(
    NEW.email, NEW.id, 'CHECK_PROFILE', 1, 'success',
    'Aucun profil existant - continuation du processus'
  );

  -- ÉTAPE 2: Rechercher invitation
  PERFORM log_trigger_step(
    NEW.email, NEW.id, 'SEARCH_INVITATION', 2, 'started',
    'Recherche invitation tenant_owner...'
  );
  
  SELECT * INTO invitation_data
  FROM public.invitations
  WHERE email = NEW.email
    AND status = 'pending'
    AND expires_at > now()
    AND invitation_type = 'tenant_owner';
    
  IF NOT FOUND THEN
    PERFORM log_trigger_step(
      NEW.email, NEW.id, 'SEARCH_INVITATION', 2, 'error',
      'Aucune invitation tenant_owner valide trouvée - arrêt du processus'
    );
    RETURN NEW;
  END IF;

  PERFORM log_trigger_step(
    NEW.email, NEW.id, 'SEARCH_INVITATION', 2, 'success',
    'Invitation trouvée: ' || invitation_data.id || ' (tenant_id: ' || invitation_data.tenant_id || ')'
  );

  -- ÉTAPE 3: Vérifier/créer rôle tenant_admin
  PERFORM log_trigger_step(
    NEW.email, NEW.id, 'CHECK_ROLE', 3, 'started',
    'Vérification rôle tenant_admin...'
  );
  
  SELECT id INTO tenant_admin_role_id
  FROM public.roles
  WHERE name = 'tenant_admin';
  
  IF tenant_admin_role_id IS NULL THEN
    PERFORM log_trigger_step(
      NEW.email, NEW.id, 'CREATE_ROLE', 3, 'started',
      'Rôle tenant_admin non trouvé - création...'
    );
    
    BEGIN
      INSERT INTO public.roles (name, description, created_at, updated_at)
      VALUES ('tenant_admin', 'Administrateur de tenant', now(), now())
      RETURNING id INTO tenant_admin_role_id;
      
      PERFORM log_trigger_step(
        NEW.email, NEW.id, 'CREATE_ROLE', 3, 'success',
        'Rôle tenant_admin créé: ' || tenant_admin_role_id
      );
    EXCEPTION
      WHEN OTHERS THEN
        PERFORM log_trigger_step(
          NEW.email, NEW.id, 'CREATE_ROLE', 3, 'error',
          'Erreur création rôle tenant_admin',
          SQLERRM
        );
        RETURN NEW;
    END;
  ELSE
    PERFORM log_trigger_step(
      NEW.email, NEW.id, 'CHECK_ROLE', 3, 'success',
      'Rôle tenant_admin existant: ' || tenant_admin_role_id
    );
  END IF;

  -- ÉTAPE 4: Assigner permissions
  PERFORM log_trigger_step(
    NEW.email, NEW.id, 'ASSIGN_PERMISSIONS', 4, 'started',
    'Attribution permissions au rôle tenant_admin...'
  );
  
  BEGIN
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
      
      permission_count := permission_count + 1;
    END LOOP;
    
    PERFORM log_trigger_step(
      NEW.email, NEW.id, 'ASSIGN_PERMISSIONS', 4, 'success',
      'Permissions assignées: ' || permission_count || ' permissions configurées'
    );
  EXCEPTION
    WHEN OTHERS THEN
      PERFORM log_trigger_step(
        NEW.email, NEW.id, 'ASSIGN_PERMISSIONS', 4, 'error',
        'Erreur attribution permissions',
        SQLERRM
      );
      RETURN NEW;
  END;

  -- ÉTAPE 5: Préparer nom entreprise
  PERFORM log_trigger_step(
    NEW.email, NEW.id, 'PREPARE_COMPANY', 5, 'started',
    'Préparation nom entreprise...'
  );
  
  company_name := COALESCE(
    invitation_data.metadata->>'company_name',
    invitation_data.full_name || ' Company'
  );
  
  PERFORM log_trigger_step(
    NEW.email, NEW.id, 'PREPARE_COMPANY', 5, 'success',
    'Nom entreprise: ' || company_name
  );

  -- ÉTAPE 6: Créer le tenant
  PERFORM log_trigger_step(
    NEW.email, NEW.id, 'CREATE_TENANT', 6, 'started',
    'Création tenant...'
  );
  
  BEGIN
    INSERT INTO public.tenants (
      id, name, status, created_at, updated_at
    ) VALUES (
      invitation_data.tenant_id, company_name, 'active', now(), now()
    );
    
    PERFORM log_trigger_step(
      NEW.email, NEW.id, 'CREATE_TENANT', 6, 'success',
      'Tenant créé: ' || invitation_data.tenant_id || ' (' || company_name || ')'
    );
  EXCEPTION
    WHEN OTHERS THEN
      PERFORM log_trigger_step(
        NEW.email, NEW.id, 'CREATE_TENANT', 6, 'error',
        'Erreur création tenant',
        SQLERRM
      );
      RETURN NEW;
  END;

  -- ÉTAPE 7: Créer le profil
  PERFORM log_trigger_step(
    NEW.email, NEW.id, 'CREATE_PROFILE', 7, 'started',
    'Création profil tenant_admin...'
  );
  
  BEGIN
    INSERT INTO public.profiles (
      user_id, tenant_id, full_name, email, role, created_at, updated_at
    ) VALUES (
      NEW.id, invitation_data.tenant_id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', invitation_data.full_name),
      NEW.email, 'tenant_admin', now(), now()
    );
    
    PERFORM log_trigger_step(
      NEW.email, NEW.id, 'CREATE_PROFILE', 7, 'success',
      'Profil créé pour tenant: ' || invitation_data.tenant_id
    );
  EXCEPTION
    WHEN OTHERS THEN
      PERFORM log_trigger_step(
        NEW.email, NEW.id, 'CREATE_PROFILE', 7, 'error',
        'Erreur création profil',
        SQLERRM
      );
      RETURN NEW;
  END;

  -- ÉTAPE 8: Créer user_roles
  PERFORM log_trigger_step(
    NEW.email, NEW.id, 'CREATE_USER_ROLES', 8, 'started',
    'Création user_roles...'
  );
  
  BEGIN
    INSERT INTO public.user_roles (
      user_id, role_id, tenant_id, is_active, created_at
    ) VALUES (
      NEW.id, tenant_admin_role_id, invitation_data.tenant_id, true, now()
    );
    
    PERFORM log_trigger_step(
      NEW.email, NEW.id, 'CREATE_USER_ROLES', 8, 'success',
      'User_roles créé: role_id=' || tenant_admin_role_id
    );
  EXCEPTION
    WHEN OTHERS THEN
      PERFORM log_trigger_step(
        NEW.email, NEW.id, 'CREATE_USER_ROLES', 8, 'error',
        'Erreur création user_roles',
        SQLERRM
      );
      RETURN NEW;
  END;

  -- ÉTAPE 9: Générer employee_id
  PERFORM log_trigger_step(
    NEW.email, NEW.id, 'GENERATE_EMPLOYEE_ID', 9, 'started',
    'Génération employee_id unique...'
  );
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id FROM 4) AS INTEGER)), 0) + 1
  INTO employee_id_counter
  FROM public.employees 
  WHERE employee_id ~ '^EMP[0-9]+$';
  
  generated_employee_id := 'EMP' || LPAD(employee_id_counter::TEXT, 3, '0');
  
  PERFORM log_trigger_step(
    NEW.email, NEW.id, 'GENERATE_EMPLOYEE_ID', 9, 'success',
    'Employee ID généré: ' || generated_employee_id
  );

  -- ÉTAPE 10: Créer employé
  PERFORM log_trigger_step(
    NEW.email, NEW.id, 'CREATE_EMPLOYEE', 10, 'started',
    'Création employé...'
  );
  
  BEGIN
    INSERT INTO public.employees (
      user_id, employee_id, full_name, email, job_title, hire_date,
      contract_type, status, tenant_id, created_at, updated_at
    ) VALUES (
      NEW.id, generated_employee_id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', invitation_data.full_name),
      NEW.email, 'Tenant Administrateur', CURRENT_DATE,
      'CDI', 'active', invitation_data.tenant_id, now(), now()
    ) RETURNING id INTO created_employee_id;
    
    PERFORM log_trigger_step(
      NEW.email, NEW.id, 'CREATE_EMPLOYEE', 10, 'success',
      'Employé créé: ' || created_employee_id || ' (' || generated_employee_id || ')'
    );
  EXCEPTION
    WHEN OTHERS THEN
      PERFORM log_trigger_step(
        NEW.email, NEW.id, 'CREATE_EMPLOYEE', 10, 'error',
        'Erreur création employé',
        SQLERRM
      );
      RETURN NEW;
  END;

  -- ÉTAPE 11: Marquer invitation comme acceptée
  PERFORM log_trigger_step(
    NEW.email, NEW.id, 'UPDATE_INVITATION', 11, 'started',
    'Mise à jour invitation...'
  );
  
  BEGIN
    UPDATE public.invitations
    SET status = 'accepted', accepted_at = now(),
        metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{completed_by}', to_jsonb(NEW.id))
    WHERE id = invitation_data.id;
    
    PERFORM log_trigger_step(
      NEW.email, NEW.id, 'UPDATE_INVITATION', 11, 'success',
      'Invitation marquée comme acceptée'
    );
  EXCEPTION
    WHEN OTHERS THEN
      PERFORM log_trigger_step(
        NEW.email, NEW.id, 'UPDATE_INVITATION', 11, 'error',
        'Erreur mise à jour invitation',
        SQLERRM
      );
      RETURN NEW;
  END;

  -- LOG: Succès complet
  PERFORM log_trigger_step(
    NEW.email, NEW.id, 'TRIGGER_COMPLETE', 12, 'success',
    'SUCCÈS COMPLET! Durée: ' || (extract(epoch from (now() - start_time)) * 1000)::INTEGER || 'ms'
  );

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    PERFORM log_trigger_step(
      NEW.email, NEW.id, 'TRIGGER_ERROR', 99, 'error',
      'ERREUR GÉNÉRALE dans le trigger',
      SQLERRM
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. REMPLACER LE TRIGGER
DROP TRIGGER IF EXISTS auto_tenant_creation_trigger_complete ON auth.users;
DROP TRIGGER IF EXISTS auto_tenant_creation_trigger ON auth.users;

CREATE TRIGGER auto_tenant_creation_trigger_with_logs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_complete_tenant_owner_with_logs();

-- 5. FONCTION POUR CONSULTER LES LOGS
CREATE OR REPLACE FUNCTION get_trigger_logs(user_email_filter TEXT DEFAULT NULL)
RETURNS TABLE (
  log_id UUID,
  user_email TEXT,
  user_id UUID,
  step_number INTEGER,
  step_name TEXT,
  status TEXT,
  message TEXT,
  error_details TEXT,
  execution_time TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id, l.user_email, l.user_id, l.step_number, l.step_name, 
    l.status, l.message, l.error_details, l.execution_time
  FROM public.trigger_execution_logs l
  WHERE (user_email_filter IS NULL OR l.user_email = user_email_filter)
  ORDER BY l.execution_time DESC, l.step_number ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. PERMISSIONS
GRANT EXECUTE ON FUNCTION log_trigger_step TO authenticated;
GRANT EXECUTE ON FUNCTION log_trigger_step TO anon;
GRANT EXECUTE ON FUNCTION get_trigger_logs TO authenticated;
GRANT EXECUTE ON FUNCTION get_trigger_logs TO anon;
GRANT SELECT, INSERT ON TABLE public.trigger_execution_logs TO authenticated;
GRANT SELECT, INSERT ON TABLE public.trigger_execution_logs TO anon;

-- 7. COMMENTAIRES
COMMENT ON FUNCTION auto_create_complete_tenant_owner_with_logs IS 'Version avec logs détaillés pour tracer chaque étape du processus';
COMMENT ON FUNCTION get_trigger_logs IS 'Consulter les logs d''exécution du trigger';
COMMENT ON TABLE public.trigger_execution_logs IS 'Table de logs pour tracer l''exécution du trigger de création tenant';

-- INSTRUCTIONS D'UTILISATION:
/*
1. CONSULTER LES LOGS GÉNÉRAUX:
   SELECT * FROM get_trigger_logs();

2. CONSULTER LES LOGS D'UN UTILISATEUR SPÉCIFIQUE:
   SELECT * FROM get_trigger_logs('nagadtest11@yahoo.com');

3. VOIR LES ERREURS UNIQUEMENT:
   SELECT * FROM get_trigger_logs() WHERE status = 'error';

4. NETTOYER LES ANCIENS LOGS:
   DELETE FROM public.trigger_execution_logs WHERE created_at < now() - interval '7 days';
*/
