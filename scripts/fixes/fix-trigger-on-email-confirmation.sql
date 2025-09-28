-- Corriger le trigger pour se déclencher sur confirmation email
-- Au lieu de INSERT, utiliser UPDATE quand email_confirmed_at change

-- 1. Supprimer l'ancien trigger sur INSERT
DROP TRIGGER IF EXISTS auto_tenant_creation_trigger ON auth.users;
DROP TRIGGER IF EXISTS auto_tenant_creation_trigger_complete ON auth.users;
DROP TRIGGER IF EXISTS auto_tenant_creation_trigger_complete_with_logs ON auth.users;
DROP TRIGGER IF EXISTS global_auto_tenant_creation_trigger ON auth.users;

-- 2. Créer le trigger sur UPDATE de email_confirmed_at
CREATE OR REPLACE FUNCTION global_auto_create_tenant_owner_on_confirmation()
RETURNS TRIGGER AS $$
DECLARE
  invitation_data RECORD;
  tenant_admin_role_id UUID;
  new_tenant_id UUID;
  new_employee_id TEXT;
  company_name TEXT;
  user_full_name TEXT;
  permission_record RECORD;
BEGIN
  -- Vérifier que c'est une confirmation d'email (OLD.email_confirmed_at était NULL)
  IF OLD.email_confirmed_at IS NOT NULL OR NEW.email_confirmed_at IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Vérifier si le profil existe déjà
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id) THEN
    RAISE NOTICE 'Profil existe déjà pour %', NEW.email;
    RETURN NEW;
  END IF;
  
  RAISE NOTICE '🚀 DÉBUT création tenant pour % (confirmation email)', NEW.email;
  
  -- Extraire le nom complet
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  -- 1. Vérifier/créer invitation
  SELECT * INTO invitation_data 
  FROM public.invitations 
  WHERE email = NEW.email 
    AND invitation_type = 'tenant_owner'
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF invitation_data.id IS NULL THEN
    INSERT INTO public.invitations (
      email,
      invitation_type,
      status,
      full_name,
      expires_at,
      metadata
    ) VALUES (
      NEW.email,
      'tenant_owner',
      'pending',
      user_full_name,
      now() + interval '7 days',
      ('{"company_name": "' || user_full_name || ' Company"}')::jsonb
    )
    RETURNING * INTO invitation_data;
    RAISE NOTICE '📬 Invitation créée pour %', NEW.email;
  END IF;
  
  company_name := COALESCE(
    invitation_data.metadata->>'company_name',
    user_full_name || ' Company'
  );
  
  -- 2. Créer/récupérer tenant
  IF invitation_data.tenant_id IS NOT NULL THEN
    new_tenant_id := invitation_data.tenant_id;
    IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = new_tenant_id) THEN
      INSERT INTO public.tenants (id, name, created_by)
      VALUES (new_tenant_id, company_name, NEW.id);
      RAISE NOTICE '🏢 Tenant créé avec UUID: %', new_tenant_id;
    END IF;
  ELSE
    INSERT INTO public.tenants (name, created_by)
    VALUES (company_name, NEW.id)
    RETURNING id INTO new_tenant_id;
    
    UPDATE public.invitations 
    SET tenant_id = new_tenant_id
    WHERE id = invitation_data.id;
    
    RAISE NOTICE '🏢 Nouveau tenant créé: %', new_tenant_id;
  END IF;
  
  -- 3. Créer profil utilisateur
  INSERT INTO public.profiles (
    user_id,
    email,
    full_name,
    tenant_id,
    role
  ) VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
    new_tenant_id,
    'tenant_owner'
  );
  RAISE NOTICE '👤 Profil créé pour %', NEW.email;
  
  -- 4. Créer/récupérer rôle tenant_admin
  SELECT id INTO tenant_admin_role_id 
  FROM public.roles 
  WHERE name = 'tenant_admin';
  
  IF tenant_admin_role_id IS NULL THEN
    INSERT INTO public.roles (name, description) 
    VALUES ('tenant_admin', 'Administrateur de tenant')
    RETURNING id INTO tenant_admin_role_id;
    RAISE NOTICE '🔑 Rôle tenant_admin créé: %', tenant_admin_role_id;
  END IF;
  
  -- 5. Créer permissions de base
  INSERT INTO public.permissions (name, description) VALUES
    ('manage_employees', 'Gérer les employés'),
    ('manage_projects', 'Gérer les projets'),
    ('manage_tasks', 'Gérer les tâches'),
    ('view_reports', 'Voir les rapports'),
    ('manage_settings', 'Gérer les paramètres')
  ON CONFLICT (name) DO NOTHING;
  
  -- 6. Attribuer permissions au rôle
  FOR permission_record IN 
    SELECT id FROM public.permissions 
    WHERE name IN ('manage_employees', 'manage_projects', 'manage_tasks', 'view_reports', 'manage_settings')
  LOOP
    INSERT INTO public.role_permissions (role_id, permission_id)
    VALUES (tenant_admin_role_id, permission_record.id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END LOOP;
  RAISE NOTICE '🔐 Permissions attribuées';
  
  -- 7. Créer user_roles
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (NEW.id, tenant_admin_role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;
  RAISE NOTICE '👥 Rôle assigné';
  
  -- 8. Créer employé
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
    NEW.email,
    user_full_name,
    NEW.id,
    new_tenant_id
  );
  RAISE NOTICE '👷 Employé créé: %', new_employee_id;
  
  -- 9. Mettre à jour invitation
  UPDATE public.invitations 
  SET status = 'accepted', 
      accepted_at = now()
  WHERE id = invitation_data.id;
  RAISE NOTICE '📬 Invitation acceptée';
  
  RAISE NOTICE '🎉 CRÉATION TENANT TERMINÉE pour %', NEW.email;
  
  RETURN NEW;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERREUR lors de la création tenant pour %: %', NEW.email, SQLERRM;
  RETURN NEW; -- Ne pas bloquer la confirmation d'email
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Créer le trigger sur UPDATE
CREATE TRIGGER global_auto_tenant_creation_on_email_confirmation
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION global_auto_create_tenant_owner_on_confirmation();

-- 4. Accorder les permissions
GRANT EXECUTE ON FUNCTION global_auto_create_tenant_owner_on_confirmation() TO authenticated;
GRANT EXECUTE ON FUNCTION global_auto_create_tenant_owner_on_confirmation() TO anon;

-- 5. Message de confirmation
SELECT 'Trigger installé sur UPDATE de email_confirmed_at' as status;
