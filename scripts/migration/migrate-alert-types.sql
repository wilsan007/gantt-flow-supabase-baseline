-- ==============================================
-- MIGRATION TABLE: alert_types
-- ==============================================
-- Convertir la table alert_types de multi-tenant vers globale

BEGIN;

-- 1. Sauvegarder les données uniques
CREATE TEMP TABLE temp_unique_alert_types AS
SELECT DISTINCT ON (code, name) 
    id, code, name, description, category, severity, auto_trigger_conditions, created_at, application_domain
FROM alert_types 
ORDER BY code, name, created_at;

-- 2. Créer le mapping ancien → nouveau ID
CREATE TEMP TABLE temp_alert_types_mapping AS
SELECT 
    old_alt.id as old_id,
    new_alt.id as new_id,
    old_alt.code
FROM alert_types old_alt
JOIN temp_unique_alert_types new_alt ON old_alt.code = new_alt.code AND old_alt.name = new_alt.name;

-- 3. Mettre à jour les références dans alert_type_solutions
UPDATE alert_type_solutions 
SET alert_type_id = atm.new_id
FROM temp_alert_types_mapping atm
WHERE alert_type_solutions.alert_type_id = atm.old_id
AND atm.new_id IN (SELECT id FROM alert_types);

-- 4. Supprimer les politiques RLS existantes
DROP POLICY IF EXISTS "Users can view alert_types for their tenant" ON alert_types;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON alert_types;
DROP POLICY IF EXISTS "alert_types_admin_only" ON alert_types;
DROP POLICY IF EXISTS "Users can view tenant alert_types" ON alert_types;
DROP POLICY IF EXISTS "Authenticated users can manage alert_types" ON alert_types;
DROP POLICY IF EXISTS "Users can view alert_types" ON alert_types;
DROP POLICY IF EXISTS "Users can manage alert_types" ON alert_types;
DROP POLICY IF EXISTS "Users can view alert types" ON alert_types;
DROP POLICY IF EXISTS "Authenticated users can manage alert types" ON alert_types;
DROP POLICY IF EXISTS "Users can view tenant alert types" ON alert_types;
DROP POLICY IF EXISTS "Users can manage tenant alert types" ON alert_types;
DROP POLICY IF EXISTS "HR can manage tenant alert types" ON alert_types;
DROP POLICY IF EXISTS "HR can manage alert types" ON alert_types;
DROP POLICY IF EXISTS "HR can view alert types" ON alert_types;

-- 5. Supprimer les doublons
DELETE FROM alert_types WHERE id NOT IN (SELECT id FROM temp_unique_alert_types);

-- 6. Repeupler avec les données uniques
INSERT INTO alert_types (id, code, name, description, category, severity, auto_trigger_conditions, created_at, application_domain)
SELECT id, code, name, description, category, severity, auto_trigger_conditions, created_at, application_domain
FROM temp_unique_alert_types
WHERE id NOT IN (SELECT id FROM alert_types);

-- 7. Supprimer la colonne tenant_id
ALTER TABLE alert_types DROP COLUMN IF EXISTS tenant_id;

-- 8. Ajouter contrainte unique
ALTER TABLE alert_types ADD CONSTRAINT unique_alert_type_code UNIQUE (code);

-- 9. Configurer RLS global
ALTER TABLE alert_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Global read access for alert_types" ON alert_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin write access for alert_types" ON alert_types FOR ALL TO authenticated 
USING (is_super_admin()) WITH CHECK (is_super_admin());

COMMIT;

-- Vérification
SELECT 'alert_types' as table_name, COUNT(*) as count FROM alert_types;
SELECT column_name FROM information_schema.columns WHERE table_name = 'alert_types' AND column_name = 'tenant_id';
