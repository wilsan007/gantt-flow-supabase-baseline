-- Créer la fonction de réparation accessible depuis le frontend
CREATE OR REPLACE FUNCTION repair_incomplete_users(target_email TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  user_record RECORD;
  invitation_data RECORD;
  tenant_admin_role_id UUID;
  new_tenant_id UUID;
  new_employee_id TEXT;
  company_name TEXT;
  user_full_name TEXT;
  permission_record RECORD;
  result JSON := '{"repaired": [], "errors": []}'::JSON;
  repaired_users JSON[] := ARRAY[]::JSON[];
  error_users JSON[] := ARRAY[]::JSON[];
BEGIN
  -- Si target_email est fourni, traiter seulement cet utilisateur
  IF target_email IS NOT NULL THEN
    FOR user_record IN 
      SELECT * FROM auth.users 
      WHERE email = target_email
    LOOP
      BEGIN
        -- Vérifier si le profil existe déjà
        IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = user_record.id) THEN
          CONTINUE;
        END IF;
        
        -- Extraire le nom complet
        user_full_name := COALESCE(
          user_record.raw_user_meta_data->>'full_name',
          SPLIT_PART(user_record.email, '@', 1)
        );
        
        -- Récupérer l'invitation
        SELECT * INTO invitation_data 
        FROM public.invitations 
        WHERE email = user_record.email 
          AND invitation_type = 'tenant_owner'
        ORDER BY created_at DESC 
        LIMIT 1;
        
        -- Si pas d'invitation, en créer une
        IF invitation_data.id IS NULL THEN
          INSERT INTO public.invitations (
            email,
            invitation_type,
            status,
            full_name,
            expires_at,
            metadata
          ) VALUES (
            user_record.email,
            'tenant_owner',
            'accepted',
            user_full_name,
            now() + interval '7 days',
            ('{"company_name": "' || user_full_name || ' Company"}')::jsonb
          )
          RETURNING * INTO invitation_data;
        END IF;
        
        company_name := COALESCE(
          invitation_data.metadata->>'company_name',
          user_full_name || ' Company'
        );
        
        -- Créer/récupérer tenant
        IF invitation_data.tenant_id IS NOT NULL THEN
          new_tenant_id := invitation_data.tenant_id;
          IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = new_tenant_id) THEN
            INSERT INTO public.tenants (id, name, created_by)
            VALUES (new_tenant_id, company_name, user_record.id);
          END IF;
        ELSE
          INSERT INTO public.tenants (name, created_by)
          VALUES (company_name, user_record.id)
          RETURNING id INTO new_tenant_id;
          
          UPDATE public.invitations 
          SET tenant_id = new_tenant_id
          WHERE id = invitation_data.id;
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
        );
        
        -- Créer/récupérer rôle tenant_admin
        SELECT id INTO tenant_admin_role_id 
        FROM public.roles 
        WHERE name = 'tenant_admin';
        
        IF tenant_admin_role_id IS NULL THEN
          INSERT INTO public.roles (name, description) 
          VALUES ('tenant_admin', 'Administrateur de tenant')
          RETURNING id INTO tenant_admin_role_id;
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
        
        -- Assigner rôle à l'utilisateur
        INSERT INTO public.user_roles (user_id, role_id)
        VALUES (user_record.id, tenant_admin_role_id)
        ON CONFLICT (user_id, role_id) DO NOTHING;
        
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
        ON CONFLICT (user_id) DO NOTHING;
        
        -- Mettre à jour invitation
        UPDATE public.invitations 
        SET status = 'accepted', 
            accepted_at = now()
        WHERE id = invitation_data.id;
        
        -- Ajouter à la liste des réparés
        repaired_users := repaired_users || json_build_object(
          'email', user_record.email,
          'user_id', user_record.id,
          'tenant_id', new_tenant_id,
          'employee_id', new_employee_id
        );
        
      EXCEPTION WHEN OTHERS THEN
        -- Ajouter à la liste des erreurs
        error_users := error_users || json_build_object(
          'email', user_record.email,
          'error', SQLERRM
        );
      END;
    END LOOP;
  END IF;
  
  -- Construire le résultat
  result := json_build_object(
    'repaired', array_to_json(repaired_users),
    'errors', array_to_json(error_users),
    'total_repaired', array_length(repaired_users, 1),
    'total_errors', array_length(error_users, 1)
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION repair_incomplete_users(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION repair_incomplete_users(TEXT) TO anon;
