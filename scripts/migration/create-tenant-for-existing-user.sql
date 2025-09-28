-- Fonction pour créer un tenant pour un utilisateur existant
-- À utiliser quand le trigger automatique ne s'est pas déclenché

CREATE OR REPLACE FUNCTION create_tenant_for_existing_user(user_email TEXT)
RETURNS JSON AS $$
DECLARE
  user_record RECORD;
  invitation_data RECORD;
  tenant_admin_role_id UUID;
  created_employee_id UUID;
  employee_id_counter INTEGER;
  generated_employee_id TEXT;
  company_name TEXT;
BEGIN
  -- 1. Récupérer l'utilisateur depuis auth.users
  SELECT * INTO user_record
  FROM auth.users
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Utilisateur non trouvé dans auth.users');
  END IF;

  -- 2. Vérifier si l'utilisateur a déjà un profil
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = user_record.id) THEN
    RETURN json_build_object('success', false, 'error', 'L''utilisateur a déjà un profil');
  END IF;

  -- 3. Chercher une invitation en attente pour cet email
  SELECT * INTO invitation_data
  FROM public.invitations
  WHERE email = user_email
    AND status = 'pending'
    AND expires_at > now()
    AND invitation_type = 'tenant_owner';
    
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Aucune invitation tenant_owner valide trouvée');
  END IF;

  -- 4. Récupérer l'ID du rôle tenant_admin
  SELECT id INTO tenant_admin_role_id
  FROM public.roles
  WHERE name = 'tenant_admin';
  
  IF tenant_admin_role_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Rôle tenant_admin non trouvé');
  END IF;

  -- 5. Extraire le nom de l'entreprise
  company_name := COALESCE(
    invitation_data.metadata->>'company_name',
    invitation_data.full_name || ' Company'
  );

  -- 6. Créer le tenant
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

  -- 7. Créer le profil utilisateur
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

  -- 8. Assigner le rôle tenant_admin
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

  -- 9. Générer un employee_id unique
  SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id FROM 4) AS INTEGER)), 0) + 1
  INTO employee_id_counter
  FROM public.employees 
  WHERE tenant_id = invitation_data.tenant_id 
    AND employee_id ~ '^EMP[0-9]+$';
  
  generated_employee_id := 'EMP' || LPAD(employee_id_counter::TEXT, 3, '0');

  -- 10. Créer l'enregistrement employé
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
    'Directeur Général',
    CURRENT_DATE,
    'CDI',
    'active',
    invitation_data.tenant_id,
    now(),
    now()
  ) RETURNING id INTO created_employee_id;

  -- 11. Marquer l'invitation comme acceptée
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

  -- 12. Retourner le résultat de succès
  RETURN json_build_object(
    'success', true,
    'message', 'Tenant owner créé avec succès',
    'user_id', user_record.id,
    'tenant_id', invitation_data.tenant_id,
    'tenant_name', company_name,
    'employee_id', generated_employee_id,
    'employee_record_id', created_employee_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Erreur lors de la création: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION create_tenant_for_existing_user TO authenticated;
GRANT EXECUTE ON FUNCTION create_tenant_for_existing_user TO anon;

-- Exemple d'utilisation :
-- SELECT create_tenant_for_existing_user('imran77@yyahoo.com');

COMMENT ON FUNCTION create_tenant_for_existing_user IS 'Crée un tenant pour un utilisateur existant qui a une invitation valide';
