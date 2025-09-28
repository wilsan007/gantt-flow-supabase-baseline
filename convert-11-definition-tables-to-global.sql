-- ==============================================
-- MIGRATION COMPLÈTE : 11 TABLES DE DÉFINITION VERS GLOBALES
-- ==============================================
-- Ce script convertit toutes les tables de définition identifiées
-- de multi-tenant vers globales partagées par tous les tenants
--
-- TABLES À CONVERTIR (11) :
-- 1. roles, 2. permissions, 3. absence_types, 4. alert_types
-- 5. evaluation_categories, 6. expense_categories, 7. alert_solutions
-- 8. skills, 9. positions, 10. role_permissions (liaison)
-- 11. alert_type_solutions (liaison alert_types ↔ alert_solutions)

BEGIN;

-- ==============================================
-- ÉTAPE 1: SAUVEGARDE DES DONNÉES UNIQUES
-- ==============================================

-- Créer des tables temporaires pour sauvegarder les définitions uniques
CREATE TEMP TABLE temp_unique_roles AS
SELECT DISTINCT ON (name) 
    id, name, display_name, description, hierarchy_level, is_system_role, created_at, updated_at
FROM roles 
ORDER BY name, created_at;

CREATE TEMP TABLE temp_unique_permissions AS
SELECT DISTINCT ON (name) 
    id, name, display_name, description, resource, action, context, created_at
FROM permissions 
ORDER BY name, created_at;

CREATE TEMP TABLE temp_unique_absence_types AS
SELECT DISTINCT ON (name, code) 
    id, name, code, color, requires_approval, deducts_from_balance, max_days_per_year, created_at, updated_at
FROM absence_types 
ORDER BY name, code, created_at;

CREATE TEMP TABLE temp_unique_alert_types AS
SELECT DISTINCT ON (code, name) 
    id, code, name, description, category, severity, auto_trigger_conditions, created_at, application_domain
FROM alert_types 
ORDER BY code, name, created_at;

CREATE TEMP TABLE temp_unique_evaluation_categories AS
SELECT DISTINCT ON (name) 
    id, name, created_at
FROM evaluation_categories 
ORDER BY name, created_at;

CREATE TEMP TABLE temp_unique_expense_categories AS
SELECT DISTINCT ON (name) 
    id, name, icon, max_amount, requires_receipt, color, created_at
FROM expense_categories 
ORDER BY name, created_at;

CREATE TEMP TABLE temp_unique_alert_solutions AS
SELECT DISTINCT ON (title, category) 
    id, title, description, action_steps, effectiveness_score, implementation_time, required_roles, cost_level, category, created_at
FROM alert_solutions 
ORDER BY title, category, created_at;

CREATE TEMP TABLE temp_unique_skills AS
SELECT DISTINCT ON (name, category) 
    id, name, category, description, created_at
FROM skills 
ORDER BY name, category, created_at;

CREATE TEMP TABLE temp_unique_positions AS
SELECT DISTINCT ON (title) 
    id, title, description, requirements, salary_range_min, salary_range_max, created_at, updated_at
FROM positions 
ORDER BY title, created_at;

CREATE TEMP TABLE temp_unique_alert_type_solutions AS
SELECT DISTINCT ON (alert_type_id, solution_id) 
    id, alert_type_id, solution_id, priority_order, context_conditions
FROM alert_type_solutions 
ORDER BY alert_type_id, solution_id;

-- ==============================================
-- ÉTAPE 2: CRÉER LES MAPPINGS ANCIEN → NOUVEAU ID
-- ==============================================

-- Mapping pour roles
CREATE TEMP TABLE temp_roles_mapping AS
SELECT 
    old_roles.id as old_id,
    new_roles.id as new_id,
    old_roles.name
FROM roles old_roles
JOIN temp_unique_roles new_roles ON old_roles.name = new_roles.name;

-- Mapping pour permissions
CREATE TEMP TABLE temp_permissions_mapping AS
SELECT 
    old_perms.id as old_id,
    new_perms.id as new_id,
    old_perms.name
FROM permissions old_perms
JOIN temp_unique_permissions new_perms ON old_perms.name = new_perms.name;

-- Mapping pour absence_types
CREATE TEMP TABLE temp_absence_types_mapping AS
SELECT 
    old_at.id as old_id,
    new_at.id as new_id,
    old_at.name
FROM absence_types old_at
JOIN temp_unique_absence_types new_at ON old_at.name = new_at.name AND old_at.code = new_at.code;

-- Mapping pour alert_types
CREATE TEMP TABLE temp_alert_types_mapping AS
SELECT 
    old_alt.id as old_id,
    new_alt.id as new_id,
    old_alt.code
FROM alert_types old_alt
JOIN temp_unique_alert_types new_alt ON old_alt.code = new_alt.code AND old_alt.name = new_alt.name;

-- Mapping pour evaluation_categories
CREATE TEMP TABLE temp_evaluation_categories_mapping AS
SELECT 
    old_ec.id as old_id,
    new_ec.id as new_id,
    old_ec.name
FROM evaluation_categories old_ec
JOIN temp_unique_evaluation_categories new_ec ON old_ec.name = new_ec.name;

-- Mapping pour expense_categories
CREATE TEMP TABLE temp_expense_categories_mapping AS
SELECT 
    old_exc.id as old_id,
    new_exc.id as new_id,
    old_exc.name
FROM expense_categories old_exc
JOIN temp_unique_expense_categories new_exc ON old_exc.name = new_exc.name;

-- Mapping pour alert_solutions
CREATE TEMP TABLE temp_alert_solutions_mapping AS
SELECT 
    old_as.id as old_id,
    new_as.id as new_id,
    old_as.title
FROM alert_solutions old_as
JOIN temp_unique_alert_solutions new_as ON old_as.title = new_as.title AND old_as.category = new_as.category;

-- Mapping pour skills
CREATE TEMP TABLE temp_skills_mapping AS
SELECT 
    old_s.id as old_id,
    new_s.id as new_id,
    old_s.name
FROM skills old_s
JOIN temp_unique_skills new_s ON old_s.name = new_s.name AND old_s.category = new_s.category;

-- Mapping pour positions
CREATE TEMP TABLE temp_positions_mapping AS
SELECT 
    old_p.id as old_id,
    new_p.id as new_id,
    old_p.title
FROM positions old_p
JOIN temp_unique_positions new_p ON old_p.title = new_p.title;

-- Mapping pour alert_type_solutions
CREATE TEMP TABLE temp_alert_type_solutions_mapping AS
SELECT 
    old_ats.id as old_id,
    new_ats.id as new_id,
    old_ats.alert_type_id,
    old_ats.solution_id
FROM alert_type_solutions old_ats
JOIN temp_unique_alert_type_solutions new_ats ON old_ats.alert_type_id = new_ats.alert_type_id AND old_ats.solution_id = new_ats.solution_id;

-- ==============================================
-- ÉTAPE 3: METTRE À JOUR LES RÉFÉRENCES
-- ==============================================

-- Mettre à jour user_roles avec les nouveaux role_id (avec validation FK)
UPDATE user_roles 
SET role_id = rm.new_id
FROM temp_roles_mapping rm
WHERE user_roles.role_id = rm.old_id
AND rm.new_id IN (SELECT id FROM roles);

-- Mettre à jour profiles.role avec les nouveaux noms de rôles (avec validation)
UPDATE profiles 
SET role = rm.name
FROM temp_roles_mapping rm
JOIN roles old_role ON rm.old_id = old_role.id
WHERE profiles.role = old_role.name
AND rm.name IN (SELECT name FROM roles);

-- Mettre à jour role_permissions avec les nouveaux IDs (avec validation FK)
UPDATE role_permissions 
SET role_id = rm.new_id
FROM temp_roles_mapping rm
WHERE role_permissions.role_id = rm.old_id
AND rm.new_id IN (SELECT id FROM roles);

UPDATE role_permissions 
SET permission_id = pm.new_id
FROM temp_permissions_mapping pm
WHERE role_permissions.permission_id = pm.old_id
AND pm.new_id IN (SELECT id FROM permissions);

-- Mettre à jour absences avec les nouveaux absence_type_id (avec validation FK)
UPDATE absences 
SET absence_type_id = atm.new_id
FROM temp_absence_types_mapping atm
WHERE absences.absence_type_id = atm.old_id
AND atm.new_id IN (SELECT id FROM absence_types);

-- Mettre à jour les autres références si elles existent
-- (Les autres tables de définition semblent ne pas avoir de références directes pour le moment)

-- ==============================================
-- ÉTAPE 4: SUPPRIMER LES POLITIQUES RLS EXISTANTES
-- ==============================================

-- Supprimer TOUTES les politiques RLS qui dépendent de tenant_id
DROP POLICY IF EXISTS "Users can view roles for their tenant" ON roles;
DROP POLICY IF EXISTS "Users can view permissions for their tenant" ON permissions;
DROP POLICY IF EXISTS "Users can view role_permissions for their tenant" ON role_permissions;
DROP POLICY IF EXISTS "Users can view absence_types for their tenant" ON absence_types;
DROP POLICY IF EXISTS "Users can view alert_types for their tenant" ON alert_types;
DROP POLICY IF EXISTS "Users can view evaluation_categories for their tenant" ON evaluation_categories;
DROP POLICY IF EXISTS "Users can view expense_categories for their tenant" ON expense_categories;
DROP POLICY IF EXISTS "Users can view alert_solutions for their tenant" ON alert_solutions;
DROP POLICY IF EXISTS "Users can view skills for their tenant" ON skills;
DROP POLICY IF EXISTS "Users can view positions for their tenant" ON positions;
DROP POLICY IF EXISTS "Users can view alert_type_solutions for their tenant" ON alert_type_solutions;

-- Supprimer toutes les autres politiques existantes
DROP POLICY IF EXISTS "tenant_isolation_policy" ON roles;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON permissions;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON role_permissions;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON absence_types;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON alert_types;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON evaluation_categories;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON expense_categories;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON alert_solutions;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON skills;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON positions;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON alert_type_solutions;

-- Supprimer les politiques avec noms spéciaux (pattern: [table]_admin_only)
DROP POLICY IF EXISTS "roles_admin_only" ON roles;
DROP POLICY IF EXISTS "permissions_admin_only" ON permissions;
DROP POLICY IF EXISTS "role_permissions_admin_only" ON role_permissions;
DROP POLICY IF EXISTS "absence_types_admin_only" ON absence_types;
DROP POLICY IF EXISTS "alert_types_admin_only" ON alert_types;
DROP POLICY IF EXISTS "evaluation_categories_admin_only" ON evaluation_categories;
DROP POLICY IF EXISTS "expense_categories_admin_only" ON expense_categories;
DROP POLICY IF EXISTS "alert_solutions_admin_only" ON alert_solutions;
DROP POLICY IF EXISTS "skills_admin_only" ON skills;
DROP POLICY IF EXISTS "positions_admin_only" ON positions;
DROP POLICY IF EXISTS "alert_type_solutions_admin_only" ON alert_type_solutions;

-- Supprimer les politiques spécifiques mentionnées dans l'erreur
DROP POLICY IF EXISTS "Users can view tenant roles" ON roles;
DROP POLICY IF EXISTS "Authenticated users can manage roles" ON roles;
DROP POLICY IF EXISTS "Users can view roles" ON roles;
DROP POLICY IF EXISTS "Users can manage roles" ON roles;

DROP POLICY IF EXISTS "Users can view tenant permissions" ON permissions;
DROP POLICY IF EXISTS "Authenticated users can manage permissions" ON permissions;
DROP POLICY IF EXISTS "Users can view permissions" ON permissions;
DROP POLICY IF EXISTS "Users can manage permissions" ON permissions;

DROP POLICY IF EXISTS "Users can view tenant role_permissions" ON role_permissions;
DROP POLICY IF EXISTS "Authenticated users can manage role_permissions" ON role_permissions;
DROP POLICY IF EXISTS "Users can view role_permissions" ON role_permissions;
DROP POLICY IF EXISTS "Users can manage role_permissions" ON role_permissions;
DROP POLICY IF EXISTS "Users can view role permissions" ON role_permissions;
DROP POLICY IF EXISTS "Authenticated users can manage role permissions" ON role_permissions;

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
DROP POLICY IF EXISTS "alert_types_admin_only" ON alert_types;

DROP POLICY IF EXISTS "Users can view tenant evaluation_categories" ON evaluation_categories;
DROP POLICY IF EXISTS "Authenticated users can manage evaluation_categories" ON evaluation_categories;
DROP POLICY IF EXISTS "Users can view evaluation_categories" ON evaluation_categories;
DROP POLICY IF EXISTS "Users can manage evaluation_categories" ON evaluation_categories;
DROP POLICY IF EXISTS "Users can view evaluation categories" ON evaluation_categories;
DROP POLICY IF EXISTS "Authenticated users can manage evaluation categories" ON evaluation_categories;
DROP POLICY IF EXISTS "Users can view tenant evaluation categories" ON evaluation_categories;
DROP POLICY IF EXISTS "Authenticated users can manage tenant evaluation categories" ON evaluation_categories;
DROP POLICY IF EXISTS "HR can manage tenant evaluation categories" ON evaluation_categories;
DROP POLICY IF EXISTS "HR can manage evaluation categories" ON evaluation_categories;
DROP POLICY IF EXISTS "HR can view evaluation categories" ON evaluation_categories;

DROP POLICY IF EXISTS "Users can view tenant expense_categories" ON expense_categories;
DROP POLICY IF EXISTS "Authenticated users can manage expense_categories" ON expense_categories;
DROP POLICY IF EXISTS "Users can view expense_categories" ON expense_categories;
DROP POLICY IF EXISTS "Users can manage expense_categories" ON expense_categories;
DROP POLICY IF EXISTS "Users can view expense categories" ON expense_categories;
DROP POLICY IF EXISTS "Authenticated users can manage expense categories" ON expense_categories;
DROP POLICY IF EXISTS "Users can view tenant expense categories" ON expense_categories;
DROP POLICY IF EXISTS "Authenticated users can manage tenant expense categories" ON expense_categories;
DROP POLICY IF EXISTS "HR can manage tenant expense categories" ON expense_categories;
DROP POLICY IF EXISTS "HR can manage expense categories" ON expense_categories;
DROP POLICY IF EXISTS "HR can view expense categories" ON expense_categories;

DROP POLICY IF EXISTS "Users can view tenant alert_solutions" ON alert_solutions;
DROP POLICY IF EXISTS "Authenticated users can manage alert_solutions" ON alert_solutions;
DROP POLICY IF EXISTS "Users can view alert_solutions" ON alert_solutions;
DROP POLICY IF EXISTS "Users can manage alert_solutions" ON alert_solutions;
DROP POLICY IF EXISTS "Users can view alert solutions" ON alert_solutions;
DROP POLICY IF EXISTS "Authenticated users can manage alert solutions" ON alert_solutions;
DROP POLICY IF EXISTS "Users can view tenant alert solutions" ON alert_solutions;
DROP POLICY IF EXISTS "Users can manage tenant alert solutions" ON alert_solutions;
DROP POLICY IF EXISTS "Authenticated users can manage tenant alert solutions" ON alert_solutions;
DROP POLICY IF EXISTS "HR can manage tenant alert solutions" ON alert_solutions;
DROP POLICY IF EXISTS "HR can manage alert solutions" ON alert_solutions;
DROP POLICY IF EXISTS "HR can view alert solutions" ON alert_solutions;

DROP POLICY IF EXISTS "Users can view tenant skills" ON skills;
DROP POLICY IF EXISTS "Authenticated users can manage skills" ON skills;
DROP POLICY IF EXISTS "Users can view skills" ON skills;
DROP POLICY IF EXISTS "Users can manage skills" ON skills;
DROP POLICY IF EXISTS "Users can view tenant skills" ON skills;
DROP POLICY IF EXISTS "Users can manage tenant skills" ON skills;
DROP POLICY IF EXISTS "Authenticated users can manage tenant skills" ON skills;
DROP POLICY IF EXISTS "HR can manage tenant skills" ON skills;
DROP POLICY IF EXISTS "HR can manage skills" ON skills;
DROP POLICY IF EXISTS "HR can view skills" ON skills;

DROP POLICY IF EXISTS "Users can view tenant positions" ON positions;
DROP POLICY IF EXISTS "Authenticated users can manage positions" ON positions;
DROP POLICY IF EXISTS "Users can view positions" ON positions;
DROP POLICY IF EXISTS "Users can manage positions" ON positions;
DROP POLICY IF EXISTS "Users can view tenant positions" ON positions;
DROP POLICY IF EXISTS "Users can manage tenant positions" ON positions;
DROP POLICY IF EXISTS "Authenticated users can manage tenant positions" ON positions;
DROP POLICY IF EXISTS "HR can manage tenant positions" ON positions;
DROP POLICY IF EXISTS "HR can manage positions" ON positions;
DROP POLICY IF EXISTS "HR can view positions" ON positions;

DROP POLICY IF EXISTS "Users can view tenant alert_type_solutions" ON alert_type_solutions;
DROP POLICY IF EXISTS "Authenticated users can manage alert_type_solutions" ON alert_type_solutions;
DROP POLICY IF EXISTS "Users can view alert_type_solutions" ON alert_type_solutions;
DROP POLICY IF EXISTS "Users can manage alert_type_solutions" ON alert_type_solutions;
DROP POLICY IF EXISTS "Users can view alert type solutions" ON alert_type_solutions;
DROP POLICY IF EXISTS "Authenticated users can manage alert type solutions" ON alert_type_solutions;
DROP POLICY IF EXISTS "Users can view tenant alert type solutions" ON alert_type_solutions;
DROP POLICY IF EXISTS "Users can manage tenant alert type solutions" ON alert_type_solutions;
DROP POLICY IF EXISTS "Authenticated users can manage tenant alert type solutions" ON alert_type_solutions;
DROP POLICY IF EXISTS "HR can manage tenant alert type solutions" ON alert_type_solutions;
DROP POLICY IF EXISTS "HR can manage alert type solutions" ON alert_type_solutions;
DROP POLICY IF EXISTS "HR can view alert type solutions" ON alert_type_solutions;

-- ==============================================
-- ÉTAPE 5: REPEUPLER LES TABLES AVEC DONNÉES UNIQUES
-- ==============================================

-- IMPORTANT: Supprimer les doublons dans l'ordre correct pour respecter les contraintes FK
-- 1. D'abord supprimer les tables de liaison qui référencent d'autres tables
-- 2. Puis supprimer les doublons des tables de définition

-- Supprimer les doublons des tables de liaison en premier
DELETE FROM alert_type_solutions 
WHERE id NOT IN (
    SELECT id FROM temp_unique_alert_type_solutions
);

DELETE FROM role_permissions 
WHERE id NOT IN (
    SELECT DISTINCT ON (rm.new_id, pm.new_id) rp.id
    FROM role_permissions rp
    JOIN temp_roles_mapping rm ON rp.role_id = rm.new_id
    JOIN temp_permissions_mapping pm ON rp.permission_id = pm.new_id
);

-- Supprimer les doublons des tables de définition (dans l'ordre des dépendances)
DELETE FROM roles WHERE id NOT IN (SELECT id FROM temp_unique_roles);
DELETE FROM permissions WHERE id NOT IN (SELECT id FROM temp_unique_permissions);
DELETE FROM alert_types WHERE id NOT IN (SELECT id FROM temp_unique_alert_types);
DELETE FROM alert_solutions WHERE id NOT IN (SELECT id FROM temp_unique_alert_solutions);
DELETE FROM absence_types WHERE id NOT IN (SELECT id FROM temp_unique_absence_types);
DELETE FROM evaluation_categories WHERE id NOT IN (SELECT id FROM temp_unique_evaluation_categories);
DELETE FROM expense_categories WHERE id NOT IN (SELECT id FROM temp_unique_expense_categories);
DELETE FROM skills WHERE id NOT IN (SELECT id FROM temp_unique_skills);
DELETE FROM positions WHERE id NOT IN (SELECT id FROM temp_unique_positions);

-- Repeupler avec les données uniques (sans tenant_id) dans l'ordre des dépendances FK
-- 1. D'abord insérer les tables de définition de base
INSERT INTO roles (id, name, display_name, description, hierarchy_level, is_system_role, created_at, updated_at)
SELECT id, name, display_name, description, hierarchy_level, is_system_role, created_at, updated_at
FROM temp_unique_roles
WHERE id NOT IN (SELECT id FROM roles);

INSERT INTO permissions (id, name, display_name, description, resource, action, context, created_at)
SELECT id, name, display_name, description, resource, action, context, created_at
FROM temp_unique_permissions
WHERE id NOT IN (SELECT id FROM permissions);

INSERT INTO alert_types (id, code, name, description, category, severity, auto_trigger_conditions, created_at, application_domain)
SELECT id, code, name, description, category, severity, auto_trigger_conditions, created_at, application_domain
FROM temp_unique_alert_types
WHERE id NOT IN (SELECT id FROM alert_types);

INSERT INTO alert_solutions (id, title, description, action_steps, effectiveness_score, implementation_time, required_roles, cost_level, category, created_at)
SELECT id, title, description, action_steps, effectiveness_score, implementation_time, required_roles, cost_level, category, created_at
FROM temp_unique_alert_solutions
WHERE id NOT IN (SELECT id FROM alert_solutions);

INSERT INTO absence_types (id, name, code, color, requires_approval, deducts_from_balance, max_days_per_year, created_at, updated_at)
SELECT id, name, code, color, requires_approval, deducts_from_balance, max_days_per_year, created_at, updated_at
FROM temp_unique_absence_types
WHERE id NOT IN (SELECT id FROM absence_types);

INSERT INTO evaluation_categories (id, name, created_at)
SELECT id, name, created_at
FROM temp_unique_evaluation_categories
WHERE id NOT IN (SELECT id FROM evaluation_categories);

INSERT INTO expense_categories (id, name, icon, max_amount, requires_receipt, color, created_at)
SELECT id, name, icon, max_amount, requires_receipt, color, created_at
FROM temp_unique_expense_categories
WHERE id NOT IN (SELECT id FROM expense_categories);

INSERT INTO skills (id, name, category, description, created_at)
SELECT id, name, category, description, created_at
FROM temp_unique_skills
WHERE id NOT IN (SELECT id FROM skills);

INSERT INTO positions (id, title, description, requirements, salary_range_min, salary_range_max, created_at, updated_at)
SELECT id, title, description, requirements, salary_range_min, salary_range_max, created_at, updated_at
FROM temp_unique_positions
WHERE id NOT IN (SELECT id FROM positions);

-- 2. Puis insérer les tables de liaison qui dépendent des tables ci-dessus
INSERT INTO alert_type_solutions (id, alert_type_id, solution_id, priority_order, context_conditions)
SELECT id, alert_type_id, solution_id, priority_order, context_conditions
FROM temp_unique_alert_type_solutions
WHERE id NOT IN (SELECT id FROM alert_type_solutions)
AND alert_type_id IN (SELECT id FROM alert_types)
AND solution_id IN (SELECT id FROM alert_solutions);

-- Recréer role_permissions avec les données uniques (sans tenant_id) et validation FK
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT DISTINCT ON (rm.new_id, pm.new_id)
    gen_random_uuid(),
    rm.new_id,
    pm.new_id,
    rp.created_at
FROM role_permissions rp
JOIN temp_roles_mapping rm ON rp.role_id = rm.old_id
JOIN temp_permissions_mapping pm ON rp.permission_id = pm.old_id
WHERE rm.new_id IN (SELECT id FROM roles)
AND pm.new_id IN (SELECT id FROM permissions)
AND NOT EXISTS (
    SELECT 1 FROM role_permissions existing 
    WHERE existing.role_id = rm.new_id 
    AND existing.permission_id = pm.new_id
);

-- ==============================================
-- ÉTAPE 6: SUPPRIMER LES COLONNES tenant_id
-- ==============================================

ALTER TABLE roles DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE permissions DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE role_permissions DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE absence_types DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE alert_types DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE evaluation_categories DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE expense_categories DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE alert_solutions DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE skills DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE positions DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE alert_type_solutions DROP COLUMN IF EXISTS tenant_id;

-- ==============================================
-- ÉTAPE 7: AJOUTER LES CONTRAINTES UNIQUES
-- ==============================================

-- Contraintes pour éviter les doublons futurs
ALTER TABLE roles ADD CONSTRAINT unique_role_name UNIQUE (name);
ALTER TABLE permissions ADD CONSTRAINT unique_permission_name UNIQUE (name);
ALTER TABLE role_permissions ADD CONSTRAINT unique_role_permission UNIQUE (role_id, permission_id);
ALTER TABLE absence_types ADD CONSTRAINT unique_absence_type_code UNIQUE (code);
ALTER TABLE alert_types ADD CONSTRAINT unique_alert_type_code UNIQUE (code);
ALTER TABLE evaluation_categories ADD CONSTRAINT unique_evaluation_category_name UNIQUE (name);
ALTER TABLE expense_categories ADD CONSTRAINT unique_expense_category_name UNIQUE (name);
ALTER TABLE alert_solutions ADD CONSTRAINT unique_alert_solution_title_category UNIQUE (title, category);
ALTER TABLE skills ADD CONSTRAINT unique_skill_name_category UNIQUE (name, category);
ALTER TABLE positions ADD CONSTRAINT unique_position_title UNIQUE (title);
ALTER TABLE alert_type_solutions ADD CONSTRAINT unique_alert_type_solution UNIQUE (alert_type_id, solution_id);

-- ==============================================
-- ÉTAPE 8: CONFIGURER L'ACCÈS GLOBAL RLS
-- ==============================================

-- Activer RLS sur toutes les tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE absence_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_type_solutions ENABLE ROW LEVEL SECURITY;

-- Politiques de lecture globale pour tous les utilisateurs authentifiés
CREATE POLICY "Global read access for roles" ON roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Global read access for permissions" ON permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Global read access for role_permissions" ON role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Global read access for absence_types" ON absence_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Global read access for alert_types" ON alert_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Global read access for evaluation_categories" ON evaluation_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Global read access for expense_categories" ON expense_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Global read access for alert_solutions" ON alert_solutions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Global read access for skills" ON skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "Global read access for positions" ON positions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Global read access for alert_type_solutions" ON alert_type_solutions FOR SELECT TO authenticated USING (true);

-- Politiques d'écriture restreintes aux super admins
CREATE POLICY "Super admin write access for roles" ON roles FOR ALL TO authenticated 
USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Super admin write access for permissions" ON permissions FOR ALL TO authenticated 
USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Super admin write access for role_permissions" ON role_permissions FOR ALL TO authenticated 
USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Super admin write access for absence_types" ON absence_types FOR ALL TO authenticated 
USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Super admin write access for alert_types" ON alert_types FOR ALL TO authenticated 
USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Super admin write access for evaluation_categories" ON evaluation_categories FOR ALL TO authenticated 
USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Super admin write access for expense_categories" ON expense_categories FOR ALL TO authenticated 
USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Super admin write access for alert_solutions" ON alert_solutions FOR ALL TO authenticated 
USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Super admin write access for skills" ON skills FOR ALL TO authenticated 
USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Super admin write access for positions" ON positions FOR ALL TO authenticated 
USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Super admin write access for alert_type_solutions" ON alert_type_solutions FOR ALL TO authenticated 
USING (is_super_admin()) WITH CHECK (is_super_admin());

COMMIT;

-- ==============================================
-- VÉRIFICATION POST-MIGRATION
-- ==============================================

-- Vérifier que les tables n'ont plus de tenant_id
SELECT 
    table_name,
    column_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('roles', 'permissions', 'role_permissions', 'absence_types', 'alert_types', 
                       'evaluation_categories', 'expense_categories', 'alert_solutions', 'skills', 'positions', 'alert_type_solutions')
    AND column_name = 'tenant_id';

-- Compter les enregistrements uniques dans chaque table
SELECT 'roles' as table_name, COUNT(*) as count FROM roles
UNION ALL
SELECT 'permissions', COUNT(*) FROM permissions
UNION ALL
SELECT 'role_permissions', COUNT(*) FROM role_permissions
UNION ALL
SELECT 'absence_types', COUNT(*) FROM absence_types
UNION ALL
SELECT 'alert_types', COUNT(*) FROM alert_types
UNION ALL
SELECT 'evaluation_categories', COUNT(*) FROM evaluation_categories
UNION ALL
SELECT 'expense_categories', COUNT(*) FROM expense_categories
UNION ALL
SELECT 'alert_solutions', COUNT(*) FROM alert_solutions
UNION ALL
SELECT 'skills', COUNT(*) FROM skills
UNION ALL
SELECT 'positions', COUNT(*) FROM positions
UNION ALL
SELECT 'alert_type_solutions', COUNT(*) FROM alert_type_solutions;

-- Vérifier que user_roles pointe toujours vers des rôles valides
SELECT 
    COUNT(*) as valid_user_roles_count
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id;
