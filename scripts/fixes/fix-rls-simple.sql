-- Script SQL simple à exécuter dans l'interface Supabase
-- https://supabase.com/dashboard/project/qliinxtanjdnwxlvnxji/sql

-- 1. Supprimer TOUTES les politiques RLS existantes
DROP POLICY IF EXISTS "roles_select_policy" ON roles;
DROP POLICY IF EXISTS "roles_insert_policy" ON roles;
DROP POLICY IF EXISTS "roles_update_policy" ON roles;
DROP POLICY IF EXISTS "roles_delete_policy" ON roles;

DROP POLICY IF EXISTS "permissions_select_policy" ON permissions;
DROP POLICY IF EXISTS "permissions_insert_policy" ON permissions;
DROP POLICY IF EXISTS "permissions_update_policy" ON permissions;
DROP POLICY IF EXISTS "permissions_delete_policy" ON permissions;

DROP POLICY IF EXISTS "user_roles_select_policy" ON user_roles;
DROP POLICY IF EXISTS "user_roles_insert_policy" ON user_roles;
DROP POLICY IF EXISTS "user_roles_update_policy" ON user_roles;
DROP POLICY IF EXISTS "user_roles_delete_policy" ON user_roles;

DROP POLICY IF EXISTS "notifications_select_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON notifications;

DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

DROP POLICY IF EXISTS "employees_select_policy" ON employees;
DROP POLICY IF EXISTS "employees_insert_policy" ON employees;
DROP POLICY IF EXISTS "employees_update_policy" ON employees;
DROP POLICY IF EXISTS "employees_delete_policy" ON employees;

DROP POLICY IF EXISTS "departments_select_policy" ON departments;
DROP POLICY IF EXISTS "departments_insert_policy" ON departments;
DROP POLICY IF EXISTS "departments_update_policy" ON departments;
DROP POLICY IF EXISTS "departments_delete_policy" ON departments;

DROP POLICY IF EXISTS "leave_requests_select_policy" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_insert_policy" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_update_policy" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_delete_policy" ON leave_requests;

DROP POLICY IF EXISTS "absence_types_select_policy" ON absence_types;
DROP POLICY IF EXISTS "absence_types_insert_policy" ON absence_types;
DROP POLICY IF EXISTS "absence_types_update_policy" ON absence_types;
DROP POLICY IF EXISTS "absence_types_delete_policy" ON absence_types;

DROP POLICY IF EXISTS "attendances_select_policy" ON attendances;
DROP POLICY IF EXISTS "attendances_insert_policy" ON attendances;
DROP POLICY IF EXISTS "attendances_update_policy" ON attendances;
DROP POLICY IF EXISTS "attendances_delete_policy" ON attendances;

DROP POLICY IF EXISTS "leave_balances_select_policy" ON leave_balances;
DROP POLICY IF EXISTS "leave_balances_insert_policy" ON leave_balances;
DROP POLICY IF EXISTS "leave_balances_update_policy" ON leave_balances;
DROP POLICY IF EXISTS "leave_balances_delete_policy" ON leave_balances;

DROP POLICY IF EXISTS "tasks_select_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_insert_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_update_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_delete_policy" ON tasks;

DROP POLICY IF EXISTS "task_actions_select_policy" ON task_actions;
DROP POLICY IF EXISTS "task_actions_insert_policy" ON task_actions;
DROP POLICY IF EXISTS "task_actions_update_policy" ON task_actions;
DROP POLICY IF EXISTS "task_actions_delete_policy" ON task_actions;

DROP POLICY IF EXISTS "projects_select_policy" ON projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON projects;
DROP POLICY IF EXISTS "projects_update_policy" ON projects;
DROP POLICY IF EXISTS "projects_delete_policy" ON projects;

DROP POLICY IF EXISTS "task_comments_select_policy" ON task_comments;
DROP POLICY IF EXISTS "task_comments_insert_policy" ON task_comments;
DROP POLICY IF EXISTS "task_comments_update_policy" ON task_comments;
DROP POLICY IF EXISTS "task_comments_delete_policy" ON task_comments;

DROP POLICY IF EXISTS "task_dependencies_select_policy" ON task_dependencies;
DROP POLICY IF EXISTS "task_dependencies_insert_policy" ON task_dependencies;
DROP POLICY IF EXISTS "task_dependencies_update_policy" ON task_dependencies;
DROP POLICY IF EXISTS "task_dependencies_delete_policy" ON task_dependencies;

DROP POLICY IF EXISTS "task_documents_select_policy" ON task_documents;
DROP POLICY IF EXISTS "task_documents_insert_policy" ON task_documents;
DROP POLICY IF EXISTS "task_documents_update_policy" ON task_documents;
DROP POLICY IF EXISTS "task_documents_delete_policy" ON task_documents;

DROP POLICY IF EXISTS "task_risks_select_policy" ON task_risks;
DROP POLICY IF EXISTS "task_risks_insert_policy" ON task_risks;
DROP POLICY IF EXISTS "task_risks_update_policy" ON task_risks;
DROP POLICY IF EXISTS "task_risks_delete_policy" ON task_risks;

DROP POLICY IF EXISTS "alert_types_select_policy" ON alert_types;
DROP POLICY IF EXISTS "alert_types_insert_policy" ON alert_types;
DROP POLICY IF EXISTS "alert_types_update_policy" ON alert_types;
DROP POLICY IF EXISTS "alert_types_delete_policy" ON alert_types;

DROP POLICY IF EXISTS "alert_solutions_select_policy" ON alert_solutions;
DROP POLICY IF EXISTS "alert_solutions_insert_policy" ON alert_solutions;
DROP POLICY IF EXISTS "alert_solutions_update_policy" ON alert_solutions;
DROP POLICY IF EXISTS "alert_solutions_delete_policy" ON alert_solutions;

DROP POLICY IF EXISTS "alert_instances_select_policy" ON alert_instances;
DROP POLICY IF EXISTS "alert_instances_insert_policy" ON alert_instances;
DROP POLICY IF EXISTS "alert_instances_update_policy" ON alert_instances;
DROP POLICY IF EXISTS "alert_instances_delete_policy" ON alert_instances;

DROP POLICY IF EXISTS "alert_instance_recommendations_select_policy" ON alert_instance_recommendations;
DROP POLICY IF EXISTS "alert_instance_recommendations_insert_policy" ON alert_instance_recommendations;
DROP POLICY IF EXISTS "alert_instance_recommendations_update_policy" ON alert_instance_recommendations;
DROP POLICY IF EXISTS "alert_instance_recommendations_delete_policy" ON alert_instance_recommendations;

-- 2. Créer des politiques RLS simples et fonctionnelles
CREATE POLICY "roles_select_policy" ON roles FOR SELECT USING (true);
CREATE POLICY "permissions_select_policy" ON permissions FOR SELECT USING (true);
CREATE POLICY "user_roles_select_policy" ON user_roles FOR SELECT USING (true);
CREATE POLICY "notifications_select_policy" ON notifications FOR SELECT USING (true);
CREATE POLICY "profiles_select_policy" ON profiles FOR SELECT USING (true);
CREATE POLICY "employees_select_policy" ON employees FOR SELECT USING (true);
CREATE POLICY "departments_select_policy" ON departments FOR SELECT USING (true);
CREATE POLICY "leave_requests_select_policy" ON leave_requests FOR SELECT USING (true);
CREATE POLICY "absence_types_select_policy" ON absence_types FOR SELECT USING (true);
CREATE POLICY "attendances_select_policy" ON attendances FOR SELECT USING (true);
CREATE POLICY "leave_balances_select_policy" ON leave_balances FOR SELECT USING (true);
CREATE POLICY "tasks_select_policy" ON tasks FOR SELECT USING (true);
CREATE POLICY "task_actions_select_policy" ON task_actions FOR SELECT USING (true);
CREATE POLICY "projects_select_policy" ON projects FOR SELECT USING (true);
CREATE POLICY "task_comments_select_policy" ON task_comments FOR SELECT USING (true);
CREATE POLICY "task_dependencies_select_policy" ON task_dependencies FOR SELECT USING (true);
CREATE POLICY "task_documents_select_policy" ON task_documents FOR SELECT USING (true);
CREATE POLICY "task_risks_select_policy" ON task_risks FOR SELECT USING (true);
CREATE POLICY "alert_types_select_policy" ON alert_types FOR SELECT USING (true);
CREATE POLICY "alert_solutions_select_policy" ON alert_solutions FOR SELECT USING (true);
CREATE POLICY "alert_instances_select_policy" ON alert_instances FOR SELECT USING (true);
CREATE POLICY "alert_instance_recommendations_select_policy" ON alert_instance_recommendations FOR SELECT USING (true);

-- 3. Ajouter les politiques INSERT/UPDATE/DELETE pour toutes les tables
CREATE POLICY "roles_insert_policy" ON roles FOR INSERT WITH CHECK (true);
CREATE POLICY "roles_update_policy" ON roles FOR UPDATE USING (true);
CREATE POLICY "roles_delete_policy" ON roles FOR DELETE USING (true);

CREATE POLICY "permissions_insert_policy" ON permissions FOR INSERT WITH CHECK (true);
CREATE POLICY "permissions_update_policy" ON permissions FOR UPDATE USING (true);
CREATE POLICY "permissions_delete_policy" ON permissions FOR DELETE USING (true);

CREATE POLICY "user_roles_insert_policy" ON user_roles FOR INSERT WITH CHECK (true);
CREATE POLICY "user_roles_update_policy" ON user_roles FOR UPDATE USING (true);
CREATE POLICY "user_roles_delete_policy" ON user_roles FOR DELETE USING (true);

CREATE POLICY "notifications_insert_policy" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update_policy" ON notifications FOR UPDATE USING (true);
CREATE POLICY "notifications_delete_policy" ON notifications FOR DELETE USING (true);

CREATE POLICY "profiles_insert_policy" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update_policy" ON profiles FOR UPDATE USING (true);
CREATE POLICY "profiles_delete_policy" ON profiles FOR DELETE USING (true);

CREATE POLICY "employees_insert_policy" ON employees FOR INSERT WITH CHECK (true);
CREATE POLICY "employees_update_policy" ON employees FOR UPDATE USING (true);
CREATE POLICY "employees_delete_policy" ON employees FOR DELETE USING (true);

CREATE POLICY "departments_insert_policy" ON departments FOR INSERT WITH CHECK (true);
CREATE POLICY "departments_update_policy" ON departments FOR UPDATE USING (true);
CREATE POLICY "departments_delete_policy" ON departments FOR DELETE USING (true);

CREATE POLICY "leave_requests_insert_policy" ON leave_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "leave_requests_update_policy" ON leave_requests FOR UPDATE USING (true);
CREATE POLICY "leave_requests_delete_policy" ON leave_requests FOR DELETE USING (true);

CREATE POLICY "absence_types_insert_policy" ON absence_types FOR INSERT WITH CHECK (true);
CREATE POLICY "absence_types_update_policy" ON absence_types FOR UPDATE USING (true);
CREATE POLICY "absence_types_delete_policy" ON absence_types FOR DELETE USING (true);

CREATE POLICY "attendances_insert_policy" ON attendances FOR INSERT WITH CHECK (true);
CREATE POLICY "attendances_update_policy" ON attendances FOR UPDATE USING (true);
CREATE POLICY "attendances_delete_policy" ON attendances FOR DELETE USING (true);

CREATE POLICY "leave_balances_insert_policy" ON leave_balances FOR INSERT WITH CHECK (true);
CREATE POLICY "leave_balances_update_policy" ON leave_balances FOR UPDATE USING (true);
CREATE POLICY "leave_balances_delete_policy" ON leave_balances FOR DELETE USING (true);

CREATE POLICY "tasks_insert_policy" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "tasks_update_policy" ON tasks FOR UPDATE USING (true);
CREATE POLICY "tasks_delete_policy" ON tasks FOR DELETE USING (true);

CREATE POLICY "task_actions_insert_policy" ON task_actions FOR INSERT WITH CHECK (true);
CREATE POLICY "task_actions_update_policy" ON task_actions FOR UPDATE USING (true);
CREATE POLICY "task_actions_delete_policy" ON task_actions FOR DELETE USING (true);

CREATE POLICY "projects_insert_policy" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "projects_update_policy" ON projects FOR UPDATE USING (true);
CREATE POLICY "projects_delete_policy" ON projects FOR DELETE USING (true);

CREATE POLICY "task_comments_insert_policy" ON task_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "task_comments_update_policy" ON task_comments FOR UPDATE USING (true);
CREATE POLICY "task_comments_delete_policy" ON task_comments FOR DELETE USING (true);

CREATE POLICY "task_dependencies_insert_policy" ON task_dependencies FOR INSERT WITH CHECK (true);
CREATE POLICY "task_dependencies_update_policy" ON task_dependencies FOR UPDATE USING (true);
CREATE POLICY "task_dependencies_delete_policy" ON task_dependencies FOR DELETE USING (true);

CREATE POLICY "task_documents_insert_policy" ON task_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "task_documents_update_policy" ON task_documents FOR UPDATE USING (true);
CREATE POLICY "task_documents_delete_policy" ON task_documents FOR DELETE USING (true);

CREATE POLICY "task_risks_insert_policy" ON task_risks FOR INSERT WITH CHECK (true);
CREATE POLICY "task_risks_update_policy" ON task_risks FOR UPDATE USING (true);
CREATE POLICY "task_risks_delete_policy" ON task_risks FOR DELETE USING (true);

CREATE POLICY "alert_types_insert_policy" ON alert_types FOR INSERT WITH CHECK (true);
CREATE POLICY "alert_types_update_policy" ON alert_types FOR UPDATE USING (true);
CREATE POLICY "alert_types_delete_policy" ON alert_types FOR DELETE USING (true);

CREATE POLICY "alert_solutions_insert_policy" ON alert_solutions FOR INSERT WITH CHECK (true);
CREATE POLICY "alert_solutions_update_policy" ON alert_solutions FOR UPDATE USING (true);
CREATE POLICY "alert_solutions_delete_policy" ON alert_solutions FOR DELETE USING (true);

CREATE POLICY "alert_instances_insert_policy" ON alert_instances FOR INSERT WITH CHECK (true);
CREATE POLICY "alert_instances_update_policy" ON alert_instances FOR UPDATE USING (true);
CREATE POLICY "alert_instances_delete_policy" ON alert_instances FOR DELETE USING (true);

CREATE POLICY "alert_instance_recommendations_insert_policy" ON alert_instance_recommendations FOR INSERT WITH CHECK (true);
CREATE POLICY "alert_instance_recommendations_update_policy" ON alert_instance_recommendations FOR UPDATE USING (true);
CREATE POLICY "alert_instance_recommendations_delete_policy" ON alert_instance_recommendations FOR DELETE USING (true);

-- 4. Vérifier qu'aucune politique ne référence tenant_members
SELECT policyname, qual FROM pg_policies WHERE qual ILIKE '%tenant_members%';
