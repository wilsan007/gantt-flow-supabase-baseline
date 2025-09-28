-- ==============================================
-- DÉPLOIEMENT FONCTION generate_next_employee_id
-- ==============================================
-- Cette fonction génère des employee_id uniques par tenant (EMP001, EMP002, etc.)

-- Fonction optimisée qui commence par le maximum existant + 1
CREATE OR REPLACE FUNCTION generate_next_employee_id(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  max_number INTEGER := 0;
  next_number INTEGER;
  candidate_id TEXT;
BEGIN
  -- Trouver le numéro maximum existant pour ce tenant
  SELECT COALESCE(
    MAX(
      CASE 
        WHEN employee_id ~ '^EMP[0-9]{3}$' 
        THEN CAST(SUBSTRING(employee_id FROM 4) AS INTEGER)
        ELSE 0
      END
    ), 0
  ) INTO max_number
  FROM public.employees 
  WHERE tenant_id = p_tenant_id;
  
  -- Commencer à partir du maximum + 1
  next_number := max_number + 1;
  
  -- Boucle de sécurité pour vérifier l'unicité
  LOOP
    candidate_id := 'EMP' || LPAD(next_number::TEXT, 3, '0');
    
    -- Vérifier si cet ID existe déjà
    IF NOT EXISTS (
      SELECT 1 FROM public.employees 
      WHERE tenant_id = p_tenant_id 
      AND employee_id = candidate_id
    ) THEN
      RETURN candidate_id;
    END IF;
    
    -- Si l'ID existe (cas rare), essayer le suivant
    next_number := next_number + 1;
    
    -- Sécurité : limiter à 999 employés par tenant
    IF next_number > 999 THEN
      RAISE EXCEPTION 'Limite de 999 employés atteinte pour le tenant %', p_tenant_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- Permissions
GRANT EXECUTE ON FUNCTION generate_next_employee_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_next_employee_id(UUID) TO anon;
GRANT EXECUTE ON FUNCTION generate_next_employee_id(UUID) TO service_role;

-- Test de la fonction
SELECT 
  'Test génération employee_id' as test_name,
  generate_next_employee_id('00000000-0000-0000-0000-000000000001'::UUID) as sample_id;
