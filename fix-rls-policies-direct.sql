-- Script SQL à exécuter directement dans l'interface Supabase
-- Aller sur https://supabase.com/dashboard/project/qliinxtanjdnwxlvnxji/sql
-- Coller ce script et l'exécuter

-- 1. Identifier les politiques qui référencent tenant_members
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    qual as policy_definition
FROM pg_policies 
WHERE qual ILIKE '%tenant_members%'
ORDER BY tablename, policyname;

-- 2. Supprimer TOUTES les politiques RLS problématiques
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

DROP POLICY IF EXISTS "notification_preferences_select_policy" ON notification_preferences;
DROP POLICY IF EXISTS "notification_preferences_insert_policy" ON notification_preferences;
DROP POLICY IF EXISTS "notification_preferences_update_policy" ON notification_preferences;
DROP POLICY IF EXISTS "notification_preferences_delete_policy" ON notification_preferences;

DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- 3. Créer de nouvelles politiques RLS pour roles
CREATE POLICY "roles_select_policy" ON roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.tenant_id = roles.tenant_id
        )
    );

CREATE POLICY "roles_insert_policy" ON roles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.tenant_id = roles.tenant_id
            AND p.role IN ('tenant_admin', 'admin')
        )
    );

CREATE POLICY "roles_update_policy" ON roles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.tenant_id = roles.tenant_id
            AND p.role IN ('tenant_admin', 'admin')
        )
    );

CREATE POLICY "roles_delete_policy" ON roles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.tenant_id = roles.tenant_id
            AND p.role IN ('tenant_admin', 'admin')
        )
    );

-- 4. Créer de nouvelles politiques RLS pour permissions
CREATE POLICY "permissions_select_policy" ON permissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.tenant_id IS NOT NULL
        )
    );

CREATE POLICY "permissions_insert_policy" ON permissions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.role IN ('tenant_admin', 'admin')
        )
    );

CREATE POLICY "permissions_update_policy" ON permissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.role IN ('tenant_admin', 'admin')
        )
    );

CREATE POLICY "permissions_delete_policy" ON permissions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.role IN ('tenant_admin', 'admin')
        )
    );

-- 5. Créer de nouvelles politiques RLS pour user_roles
CREATE POLICY "user_roles_select_policy" ON user_roles
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.tenant_id = user_roles.tenant_id
            AND p.role IN ('tenant_admin', 'admin', 'hr_manager')
        )
    );

CREATE POLICY "user_roles_insert_policy" ON user_roles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.tenant_id = user_roles.tenant_id
            AND p.role IN ('tenant_admin', 'admin', 'hr_manager')
        )
    );

CREATE POLICY "user_roles_update_policy" ON user_roles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.tenant_id = user_roles.tenant_id
            AND p.role IN ('tenant_admin', 'admin', 'hr_manager')
        )
    );

CREATE POLICY "user_roles_delete_policy" ON user_roles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.tenant_id = user_roles.tenant_id
            AND p.role IN ('tenant_admin', 'admin', 'hr_manager')
        )
    );

-- 6. Créer de nouvelles politiques RLS pour notifications
CREATE POLICY "notifications_select_policy" ON notifications
    FOR SELECT USING (
        recipient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.tenant_id = notifications.tenant_id
        )
    );

CREATE POLICY "notifications_insert_policy" ON notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.tenant_id = notifications.tenant_id
        )
    );

CREATE POLICY "notifications_update_policy" ON notifications
    FOR UPDATE USING (
        recipient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.tenant_id = notifications.tenant_id
        )
    );

CREATE POLICY "notifications_delete_policy" ON notifications
    FOR DELETE USING (
        recipient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.tenant_id = notifications.tenant_id
        )
    );

-- 7. Créer de nouvelles politiques RLS pour notification_preferences
CREATE POLICY "notification_preferences_select_policy" ON notification_preferences
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notification_preferences_insert_policy" ON notification_preferences
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "notification_preferences_update_policy" ON notification_preferences
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notification_preferences_delete_policy" ON notification_preferences
    FOR DELETE USING (user_id = auth.uid());

-- 8. Créer de nouvelles politiques RLS pour profiles (sans récursion)
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT USING (
        user_id = auth.uid() OR
        (tenant_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM auth.users u 
            WHERE u.id = auth.uid()
        ))
    );

CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "profiles_delete_policy" ON profiles
    FOR DELETE USING (user_id = auth.uid());

-- 9. Créer des politiques RLS pour les tables d'alertes
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

-- Politiques pour alert_types
CREATE POLICY "alert_types_select_policy" ON alert_types
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.tenant_id = alert_types.tenant_id
        )
    );

CREATE POLICY "alert_types_insert_policy" ON alert_types
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.tenant_id = alert_types.tenant_id
            AND p.role IN ('tenant_admin', 'admin')
        )
    );

CREATE POLICY "alert_types_update_policy" ON alert_types
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.tenant_id = alert_types.tenant_id
            AND p.role IN ('tenant_admin', 'admin')
        )
    );

CREATE POLICY "alert_types_delete_policy" ON alert_types
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.tenant_id = alert_types.tenant_id
            AND p.role IN ('tenant_admin', 'admin')
        )
    );

-- Politiques pour alert_solutions
CREATE POLICY "alert_solutions_select_policy" ON alert_solutions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.tenant_id = alert_solutions.tenant_id
        )
    );

CREATE POLICY "alert_solutions_insert_policy" ON alert_solutions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.tenant_id = alert_solutions.tenant_id
            AND p.role IN ('tenant_admin', 'admin')
        )
    );

CREATE POLICY "alert_solutions_update_policy" ON alert_solutions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.tenant_id = alert_solutions.tenant_id
            AND p.role IN ('tenant_admin', 'admin')
        )
    );

CREATE POLICY "alert_solutions_delete_policy" ON alert_solutions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.tenant_id = alert_solutions.tenant_id
            AND p.role IN ('tenant_admin', 'admin')
        )
    );

-- Politiques pour alert_instances
CREATE POLICY "alert_instances_select_policy" ON alert_instances
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.tenant_id = alert_instances.tenant_id
        )
    );

CREATE POLICY "alert_instances_insert_policy" ON alert_instances
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.tenant_id = alert_instances.tenant_id
        )
    );

CREATE POLICY "alert_instances_update_policy" ON alert_instances
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.tenant_id = alert_instances.tenant_id
        )
    );

CREATE POLICY "alert_instances_delete_policy" ON alert_instances
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.tenant_id = alert_instances.tenant_id
            AND p.role IN ('tenant_admin', 'admin')
        )
    );

-- Politiques pour alert_instance_recommendations
CREATE POLICY "alert_instance_recommendations_select_policy" ON alert_instance_recommendations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM alert_instances ai
            JOIN profiles p ON p.user_id = auth.uid() AND p.tenant_id = ai.tenant_id
            WHERE ai.id = alert_instance_recommendations.alert_instance_id
        )
    );

CREATE POLICY "alert_instance_recommendations_insert_policy" ON alert_instance_recommendations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM alert_instances ai
            JOIN profiles p ON p.user_id = auth.uid() AND p.tenant_id = ai.tenant_id
            WHERE ai.id = alert_instance_recommendations.alert_instance_id
        )
    );

CREATE POLICY "alert_instance_recommendations_update_policy" ON alert_instance_recommendations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM alert_instances ai
            JOIN profiles p ON p.user_id = auth.uid() AND p.tenant_id = ai.tenant_id
            WHERE ai.id = alert_instance_recommendations.alert_instance_id
        )
    );

CREATE POLICY "alert_instance_recommendations_delete_policy" ON alert_instance_recommendations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM alert_instances ai
            JOIN profiles p ON p.user_id = auth.uid() AND p.tenant_id = ai.tenant_id AND p.role IN ('tenant_admin', 'admin')
            WHERE ai.id = alert_instance_recommendations.alert_instance_id
        )
    );

-- 10. Vérification finale
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    qual as policy_definition
FROM pg_policies 
WHERE qual ILIKE '%tenant_members%'
ORDER BY tablename, policyname;
