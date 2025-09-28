-- ==============================================
-- MIGRATION TABLE: absence_types
-- ==============================================
-- Convertir la table absence_types de multi-tenant vers globale

BEGIN;

-- 1. Sauvegarder les données uniques
CREATE TEMP TABLE temp_unique_absence_types AS
SELECT DISTINCT ON (name, code) 
    id, name, code, color, requires_approval, deducts_from_balance, max_days_per_year, created_at, updated_at
FROM absence_types 
ORDER BY name, code, created_at;

-- 2. Créer le mapping ancien → nouveau ID
CREATE TEMP TABLE temp_absence_types_mapping AS
SELECT 
    old_at.id as old_id,
    new_at.id as new_id,
    old_at.name
FROM absence_types old_at
JOIN temp_unique_absence_types new_at ON old_at.name = new_at.name AND old_at.code = new_at.code;

-- 3. Mettre à jour les références dans absences
UPDATE absences 
SET absence_type_id = atm.new_id
FROM temp_absence_types_mapping atm
WHERE absences.absence_type_id = atm.old_id
AND atm.new_id IN (SELECT id FROM absence_types);

-- 4. Supprimer les politiques RLS existantes
DROP POLICY IF EXISTS "Users can view absence_types for their tenant" ON absence_types;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON absence_types;
DROP POLICY IF EXISTS "absence_types_admin_only" ON absence_types;
DROP POLICY IF EXISTS "Users can view tenant absence_types" ON absence_types;
DROP POLICY IF EXISTS "Authenticated users can manage absence_types" ON absence_types;
DROP POLICY IF EXISTS "Users can view absence_types" ON absence_types;
DROP POLICY IF EXISTS "Users can manage absence_types" ON absence_types;
DROP POLICY IF EXISTS "Users can view absence types" ON absence_types;
DROP POLICY IF EXISTS "Authenticated users can manage absence types" ON absence_types;
DROP POLICY IF EXISTS "Users can view tenant absence types" ON absence_types;
DROP POLICY IF EXISTS "Users can manage tenant absence types" ON absence_types;
DROP POLICY IF EXISTS "HR can manage tenant absence types" ON absence_types;
DROP POLICY IF EXISTS "HR can manage absence types" ON absence_types;
DROP POLICY IF EXISTS "HR can view absence types" ON absence_types;

-- 5. Supprimer les doublons
DELETE FROM absence_types WHERE id NOT IN (SELECT id FROM temp_unique_absence_types);

-- 6. Repeupler avec les données uniques
INSERT INTO absence_types (id, name, code, color, requires_approval, deducts_from_balance, max_days_per_year, created_at, updated_at)
SELECT id, name, code, color, requires_approval, deducts_from_balance, max_days_per_year, created_at, updated_at
FROM temp_unique_absence_types
WHERE id NOT IN (SELECT id FROM absence_types);

-- 7. Supprimer la colonne tenant_id
ALTER TABLE absence_types DROP COLUMN IF EXISTS tenant_id;

-- 8. Ajouter contrainte unique
ALTER TABLE absence_types ADD CONSTRAINT unique_absence_type_code UNIQUE (code);

-- 9. Configurer RLS global
ALTER TABLE absence_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Global read access for absence_types" ON absence_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin write access for absence_types" ON absence_types FOR ALL TO authenticated 
USING (is_super_admin()) WITH CHECK (is_super_admin());

COMMIT;

-- Vérification
SELECT 'absence_types' as table_name, COUNT(*) as count FROM absence_types;
SELECT column_name FROM information_schema.columns WHERE table_name = 'absence_types' AND column_name = 'tenant_id';
