-- Fonction complète pour l'inscription d'un tenant owner avec toutes les procédures
-- Cette fonction crée le tenant, le profil, les rôles ET l'employé

CREATE OR REPLACE FUNCTION signup_tenant_owner_v6(
  invitation_token TEXT,
  user_email TEXT,
  user_full_name TEXT,
  company_name TEXT,
  user_id UUID
)
RETURNS JSON AS $$
DECLARE
  invitation_data RECORD;
  tenant_admin_role_id UUID;
  created_employee_id UUID;
  employee_id_counter INTEGER;
  generated_employee_id TEXT;
BEGIN
  -- 1. Valider le token d'invitation
  SELECT * INTO invitation_data
  FROM public.invitations
  WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > now()
    AND invitation_type = 'tenant_owner';
    
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Token d''invitation invalide ou expiré'
    );
  END IF;
  
  -- 2. Récupérer l'ID du rôle tenant_admin
  SELECT id INTO tenant_admin_role_id
  FROM public.roles
  WHERE name = 'tenant_admin';
  
  IF tenant_admin_role_id IS NULL THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Rôle tenant_admin non trouvé'
    );
  END IF;
  
  -- 3. Créer le tenant avec l'ID de l'invitation
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
  
  -- 4. Créer le profil utilisateur
  INSERT INTO public.profiles (
    user_id,
    tenant_id,
    full_name,
    email,
    role,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    invitation_data.tenant_id,
    user_full_name,
    user_email,
    'tenant_admin',
    now(),
    now()
  ) ON CONFLICT (user_id) DO UPDATE SET
    tenant_id = invitation_data.tenant_id,
    full_name = user_full_name,
    email = user_email,
    role = 'tenant_admin',
    updated_at = now();
  
  -- 5. Assigner le rôle tenant_admin à l'utilisateur
  INSERT INTO public.user_roles (
    user_id,
    role_id,
    tenant_id,
    is_active,
    created_at
  ) VALUES (
    user_id,
    tenant_admin_role_id,
    invitation_data.tenant_id,
    true,
    now()
  ) ON CONFLICT (user_id, role_id, tenant_id) DO UPDATE SET
    is_active = true,
    updated_at = now();
  
  -- 6. Générer un employee_id unique pour ce tenant
  SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id FROM 4) AS INTEGER)), 0) + 1
  INTO employee_id_counter
  FROM public.employees 
  WHERE tenant_id = invitation_data.tenant_id 
    AND employee_id ~ '^EMP[0-9]+$';
  
  generated_employee_id := 'EMP' || LPAD(employee_id_counter::TEXT, 3, '0');
  
  -- 7. Créer l'enregistrement employé pour le tenant owner
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
    user_id,
    generated_employee_id,
    user_full_name,
    user_email,
    'Directeur Général',
    CURRENT_DATE,
    'CDI',
    'active',
    invitation_data.tenant_id,
    now(),
    now()
  ) RETURNING id INTO created_employee_id;
  
  -- 8. Marquer l'invitation comme acceptée
  UPDATE public.invitations
  SET 
    status = 'accepted',
    accepted_at = now(),
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{completed_by}',
      to_jsonb(user_id)
    )
  WHERE id = invitation_data.id;
  
  -- 9. Retourner le résultat de succès
  RETURN json_build_object(
    'success', true,
    'message', 'Inscription réussie - Tenant, profil, rôles et employé créés',
    'user_id', user_id,
    'tenant_id', invitation_data.tenant_id,
    'tenant_name', company_name,
    'employee_id', generated_employee_id,
    'employee_record_id', created_employee_id,
    'email', user_email
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Gestion des erreurs avec rollback automatique
    RETURN json_build_object(
      'success', false, 
      'error', 'Erreur lors de la finalisation de l''inscription: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION signup_tenant_owner_v6 TO authenticated;
GRANT EXECUTE ON FUNCTION signup_tenant_owner_v6 TO anon;

-- Commentaire d'utilisation :
-- Cette fonction v6 inclut maintenant TOUTES les procédures nécessaires :
-- 1. Validation du token d'invitation
-- 2. Création du tenant
-- 3. Création du profil utilisateur avec rôle tenant_admin
-- 4. Attribution du rôle dans user_roles
-- 5. Création de l'enregistrement employé avec employee_id unique
-- 6. Marquage de l'invitation comme acceptée
