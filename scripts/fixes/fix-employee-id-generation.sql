-- ==============================================
-- Création de la fonction de génération d'ID d'employé
-- ==============================================
-- Cette fonction génère un ID d'employé unique et séquentiel (EMP001, EMP002, etc.)
-- de manière atomique pour éviter les doublons.

-- 1. Créer une séquence pour gérer le compteur
CREATE SEQUENCE IF NOT EXISTS employee_id_seq;

-- 2. Créer la fonction qui utilise cette séquence
CREATE OR REPLACE FUNCTION next_employee_id()
RETURNS TEXT AS $$
DECLARE
  next_val INTEGER;
BEGIN
  -- Récupérer la prochaine valeur de la séquence
  SELECT nextval('employee_id_seq') INTO next_val;
  -- Formater l'ID de l'employé
  RETURN 'EMP' || LPAD(next_val::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql VOLATILE;

SELECT 'Fonction next_employee_id() créée/mise à jour avec succès.' as status;
    
    -- Vérifier s'il y a des invitations pour cet email
    DECLARE
      inv_count INTEGER;
      inv_details TEXT := '';
    BEGIN
      SELECT COUNT(*) INTO inv_count FROM public.invitations WHERE email = user_email;
      debug_log := debug_log || '📊 Nombre total d''invitations pour cet email: ' || inv_count || E'\n';
      
      IF inv_count > 0 THEN
        SELECT string_agg(
          'ID: ' || id || ', Type: ' || invitation_type || ', Status: ' || status || ', Expires: ' || expires_at,
          E'\n'
        ) INTO inv_details
        FROM public.invitations 
        WHERE email = user_email;
        
        debug_log := debug_log || '📋 Détails invitations:' || E'\n' || inv_details || E'\n';
      END IF;
    END;
    
    RAISE NOTICE '%', debug_log;
    RETURN json_build_object('success', false, 'error', 'Aucune invitation valide', 'debug_log', debug_log);
  END IF;

  debug_log := debug_log || '✅ Invitation trouvée: ' || invitation_data.id || E'\n';
  debug_log := debug_log || '   - Tenant ID: ' || invitation_data.tenant_id || E'\n';
  debug_log := debug_log || '   - Full Name: ' || invitation_data.full_name || E'\n';

  -- 4. Vérifier rôle tenant_admin
  debug_log := debug_log || '4️⃣ Recherche rôle tenant_admin...' || E'\n';
  
  SELECT id INTO tenant_admin_role_id
  FROM public.roles
  WHERE name = 'tenant_admin';
  
  IF tenant_admin_role_id IS NULL THEN
    debug_log := debug_log || '❌ ERREUR: Rôle tenant_admin non trouvé' || E'\n';
    RAISE NOTICE '%', debug_log;
    RETURN json_build_object('success', false, 'error', 'Rôle tenant_admin non trouvé', 'debug_log', debug_log);
  END IF;

  debug_log := debug_log || '✅ Rôle tenant_admin trouvé: ' || tenant_admin_role_id || E'\n';

  -- 5. Préparer nom entreprise
  debug_log := debug_log || '5️⃣ Préparation nom entreprise...' || E'\n';
  
  company_name := COALESCE(
    invitation_data.metadata->>'company_name',
    invitation_data.full_name || ' Company'
  );
  
  debug_log := debug_log || '✅ Nom entreprise: ' || company_name || E'\n';

  -- 6. Créer le tenant
  debug_log := debug_log || '6️⃣ Création tenant...' || E'\n';
  
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

  -- 7. Créer le profil
  debug_log := debug_log || '7️⃣ Création profil...' || E'\n';
  
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
    
    debug_log := debug_log || '✅ Profil créé avec succès' || E'\n';
  EXCEPTION
    WHEN OTHERS THEN
      debug_log := debug_log || '❌ ERREUR création profil: ' || SQLERRM || E'\n';
      RAISE NOTICE '%', debug_log;
      RETURN json_build_object('success', false, 'error', 'Erreur création profil: ' || SQLERRM, 'debug_log', debug_log);
  END;

  -- 8. Créer user_roles
  debug_log := debug_log || '8️⃣ Création user_roles...' || E'\n';
  
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
    
    debug_log := debug_log || '✅ User_roles créé avec succès' || E'\n';
  EXCEPTION
    WHEN OTHERS THEN
      debug_log := debug_log || '❌ ERREUR création user_roles: ' || SQLERRM || E'\n';
      RAISE NOTICE '%', debug_log;
      RETURN json_build_object('success', false, 'error', 'Erreur création user_roles: ' || SQLERRM, 'debug_log', debug_log);
  END;

  -- 9. Générer employee_id (maintenant basé sur tenant pour éviter les doublons)
  debug_log := debug_log || '9️⃣ Génération employee_id...' || E'\n';
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id FROM 4) AS INTEGER)), 0) + 1
  INTO employee_id_counter
  FROM public.employees 
  WHERE tenant_id = invitation_data.tenant_id 
    AND employee_id ~ '^EMP[0-9]+$';
  
  generated_employee_id := 'EMP' || LPAD(employee_id_counter::TEXT, 3, '0');
  debug_log := debug_log || '✅ Employee ID généré: ' || generated_employee_id || E'\n';

  -- 10. Créer employé (utilise user_id comme clé unique au lieu d'employee_id)
  debug_log := debug_log || '🔟 Création employé...' || E'\n';
  
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
      'Directeur Général',
      CURRENT_DATE,
      'CDI',
      'active',
      invitation_data.tenant_id,
      now(),
      now()
    ) 
    ON CONFLICT (user_id) DO UPDATE SET
      employee_id = EXCLUDED.employee_id,
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      job_title = EXCLUDED.job_title,
      hire_date = EXCLUDED.hire_date,
      contract_type = EXCLUDED.contract_type,
      status = EXCLUDED.status,
      tenant_id = EXCLUDED.tenant_id,
      updated_at = now()
    RETURNING id INTO created_employee_id;
    
    debug_log := debug_log || '✅ Employé créé/mis à jour avec succès: ' || created_employee_id || E'\n';
  EXCEPTION
    WHEN OTHERS THEN
      debug_log := debug_log || '❌ ERREUR création employé: ' || SQLERRM || E'\n';
      RAISE NOTICE '%', debug_log;
      RETURN json_build_object('success', false, 'error', 'Erreur création employé: ' || SQLERRM, 'debug_log', debug_log);
  END;

  -- 11. Marquer invitation comme acceptée
  debug_log := debug_log || '1️⃣1️⃣ Mise à jour invitation...' || E'\n';
  
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

  debug_log := debug_log || '🎉 SUCCÈS COMPLET!' || E'\n';
  RAISE NOTICE '%', debug_log;

  RETURN json_build_object(
    'success', true,
    'message', 'Tenant owner créé avec succès',
    'user_id', user_record.id,
    'tenant_id', invitation_data.tenant_id,
    'tenant_name', company_name,
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

COMMENT ON FUNCTION debug_tenant_creation IS 'Version corrigée utilisant user_id comme contrainte unique pour éviter les doublons employee_id';
