-- ==============================================
-- Fonction de génération d'ID employé sécurisée par tenant
-- ==============================================
-- Génère un employee_id unique par tenant (EMP001, EMP002, etc.)
-- Évite les doublons en vérifiant les IDs existants

-- Fonction pour générer un employee_id unique par tenant
CREATE OR REPLACE FUNCTION generate_unique_employee_id(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER := 1;
  candidate_id TEXT;
  max_attempts INTEGER := 1000;
  attempt_count INTEGER := 0;
BEGIN
  -- Boucle pour trouver le prochain ID disponible
  LOOP
    -- Formater l'ID candidat
    candidate_id := 'EMP' || LPAD(next_number::TEXT, 3, '0');
    
    -- Vérifier si cet ID existe déjà pour ce tenant
    IF NOT EXISTS (
      SELECT 1 FROM public.employees 
      WHERE tenant_id = p_tenant_id 
      AND employee_id = candidate_id
    ) THEN
      -- ID disponible, le retourner
      RETURN candidate_id;
    END IF;
    
    -- Incrémenter pour le prochain essai
    next_number := next_number + 1;
    attempt_count := attempt_count + 1;
    
    -- Sécurité : éviter une boucle infinie
    IF attempt_count >= max_attempts THEN
      RAISE EXCEPTION 'Impossible de générer un employee_id unique après % tentatives', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql VOLATILE;

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
$$ LANGUAGE plpgsql VOLATILE;

-- Test de la fonction
SELECT 
  'Fonctions employee_id créées avec succès' as status,
  'generate_unique_employee_id() et generate_next_employee_id() disponibles' as details;
