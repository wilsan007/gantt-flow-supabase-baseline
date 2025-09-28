-- Script pour supprimer la table tenant_members en toute sécurité
-- Exécuter avec la clé service_role

-- 1. Vérifier les contraintes de clés étrangères qui référencent tenant_members
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'tenant_members';

-- 2. Vérifier les politiques RLS sur tenant_members
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'tenant_members';

-- 3. Vérifier les triggers sur tenant_members
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'tenant_members';

-- 4. Vérifier les index sur tenant_members
SELECT indexname, indexdef
FROM pg_indexes 
WHERE tablename = 'tenant_members';

-- 5. Compter les enregistrements dans tenant_members
SELECT COUNT(*) as total_records FROM tenant_members;

-- 6. Supprimer toutes les politiques RLS sur tenant_members
DROP POLICY IF EXISTS "tenant_members_select_policy" ON tenant_members;
DROP POLICY IF EXISTS "tenant_members_insert_policy" ON tenant_members;
DROP POLICY IF EXISTS "tenant_members_update_policy" ON tenant_members;
DROP POLICY IF EXISTS "tenant_members_delete_policy" ON tenant_members;

-- Supprimer toutes les autres politiques qui pourraient exister
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'tenant_members'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON tenant_members';
    END LOOP;
END $$;

-- 7. Désactiver RLS sur tenant_members
ALTER TABLE tenant_members DISABLE ROW LEVEL SECURITY;

-- 8. Supprimer tous les triggers sur tenant_members
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name FROM information_schema.triggers 
        WHERE event_object_table = 'tenant_members'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(trigger_record.trigger_name) || ' ON tenant_members';
    END LOOP;
END $$;

-- 9. Supprimer les contraintes UNIQUE avant les index
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT constraint_name FROM information_schema.table_constraints 
        WHERE table_name = 'tenant_members' 
        AND constraint_type = 'UNIQUE'
    LOOP
        EXECUTE 'ALTER TABLE tenant_members DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_record.constraint_name);
    END LOOP;
END $$;

-- 10. Supprimer tous les index restants sur tenant_members
DO $$
DECLARE
    index_record RECORD;
BEGIN
    FOR index_record IN 
        SELECT indexname FROM pg_indexes 
        WHERE tablename = 'tenant_members' 
        AND indexname NOT LIKE '%_pkey'
    LOOP
        EXECUTE 'DROP INDEX IF EXISTS ' || quote_ident(index_record.indexname);
    END LOOP;
END $$;

-- 11. Supprimer les contraintes de clés étrangères qui référencent tenant_members
-- (Normalement, il ne devrait pas y en avoir car nous utilisons user_roles maintenant)

-- 12. Finalement, supprimer la table tenant_members
DROP TABLE IF EXISTS tenant_members CASCADE;

-- 13. Vérifier que la table a été supprimée
SELECT COUNT(*) as table_exists 
FROM information_schema.tables 
WHERE table_name = 'tenant_members' AND table_schema = 'public';

-- 14. Message de confirmation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'tenant_members' AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ Table tenant_members supprimée avec succès';
    ELSE
        RAISE NOTICE '❌ Erreur: Table tenant_members existe encore';
    END IF;
END $$;
