-- Script pour corriger les politiques RLS après suppression de tenant_members
-- Exécuter avec la clé service_role

-- 1. Identifier toutes les politiques RLS qui référencent tenant_members
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    qual as policy_definition
FROM pg_policies 
WHERE qual ILIKE '%tenant_members%'
ORDER BY tablename, policyname;

-- 2. Supprimer les anciennes politiques RLS problématiques sur roles
DROP POLICY IF EXISTS "roles_select_policy" ON roles;
DROP POLICY IF EXISTS "roles_insert_policy" ON roles;
DROP POLICY IF EXISTS "roles_update_policy" ON roles;
DROP POLICY IF EXISTS "roles_delete_policy" ON roles;

-- 3. Créer de nouvelles politiques RLS pour roles (basées sur profiles.tenant_id)
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

-- 4. Supprimer les anciennes politiques RLS problématiques sur permissions
DROP POLICY IF EXISTS "permissions_select_policy" ON permissions;
DROP POLICY IF EXISTS "permissions_insert_policy" ON permissions;
DROP POLICY IF EXISTS "permissions_update_policy" ON permissions;
DROP POLICY IF EXISTS "permissions_delete_policy" ON permissions;

-- 5. Créer de nouvelles politiques RLS pour permissions (basées sur profiles.tenant_id)
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

-- 6. Supprimer les anciennes politiques RLS problématiques sur user_roles
DROP POLICY IF EXISTS "user_roles_select_policy" ON user_roles;
DROP POLICY IF EXISTS "user_roles_insert_policy" ON user_roles;
DROP POLICY IF EXISTS "user_roles_update_policy" ON user_roles;
DROP POLICY IF EXISTS "user_roles_delete_policy" ON user_roles;

-- 7. Créer de nouvelles politiques RLS pour user_roles (basées sur profiles.tenant_id)
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

-- 8. Supprimer les anciennes politiques RLS problématiques sur notifications
DROP POLICY IF EXISTS "notifications_select_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON notifications;

-- 9. Créer de nouvelles politiques RLS pour notifications (basées sur tenant_id)
CREATE POLICY "notifications_select_policy" ON notifications
    FOR SELECT USING (
        user_id = auth.uid() OR
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
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.tenant_id = notifications.tenant_id
        )
    );

CREATE POLICY "notifications_delete_policy" ON notifications
    FOR DELETE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.tenant_id = notifications.tenant_id
        )
    );

-- 10. Supprimer les anciennes politiques RLS problématiques sur notification_preferences
DROP POLICY IF EXISTS "notification_preferences_select_policy" ON notification_preferences;
DROP POLICY IF EXISTS "notification_preferences_insert_policy" ON notification_preferences;
DROP POLICY IF EXISTS "notification_preferences_update_policy" ON notification_preferences;
DROP POLICY IF EXISTS "notification_preferences_delete_policy" ON notification_preferences;

-- 11. Créer de nouvelles politiques RLS pour notification_preferences
CREATE POLICY "notification_preferences_select_policy" ON notification_preferences
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notification_preferences_insert_policy" ON notification_preferences
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "notification_preferences_update_policy" ON notification_preferences
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notification_preferences_delete_policy" ON notification_preferences
    FOR DELETE USING (user_id = auth.uid());

-- 12. Vérifier les politiques RLS sur profiles (ne pas toucher si elles fonctionnent)
-- Les politiques profiles devraient déjà être correctes car elles utilisent tenant_id

-- 13. Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Politiques RLS mises à jour avec succès';
    RAISE NOTICE '📋 Tables corrigées: roles, permissions, user_roles, notifications, notification_preferences';
    RAISE NOTICE '🔒 Toutes les politiques utilisent maintenant profiles.tenant_id et profiles.role';
    RAISE NOTICE '🏢 Compatible avec la logique useTenant du TenantContext';
END $$;
