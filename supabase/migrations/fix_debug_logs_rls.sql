-- FIX RLS pour debug_logs
ALTER TABLE debug_logs ENABLE ROW LEVEL SECURITY;

-- Supprimer anciennes politiques
DROP POLICY IF EXISTS "debug_logs_select_policy" ON debug_logs;
DROP POLICY IF EXISTS "debug_logs_insert_policy" ON debug_logs;

-- SELECT : Admins seulement
CREATE POLICY "debug_logs_select_policy"
ON debug_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.id
    JOIN roles r ON r.id = ur.role_id
    WHERE p.id = auth.uid()
    AND r.name IN ('super_admin', 'admin')
  )
);

-- INSERT : Tout utilisateur authentifié
CREATE POLICY "debug_logs_insert_policy"
ON debug_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
