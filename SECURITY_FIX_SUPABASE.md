# 🔐 CORRECTION URGENTE : Secret Supabase Exposé

## ⚠️ PROBLÈME

Votre `service_role_key` Supabase a été exposée publiquement sur GitHub.
**Cette clé donne un accès COMPLET à votre base de données.**

## 🚨 ACTIONS IMMÉDIATES (À FAIRE MAINTENANT)

### 1. Révoquer l'Ancienne Clé

1. Allez sur **Supabase Dashboard** : https://supabase.com/dashboard
2. Sélectionnez votre projet : `qliinxtanjdnwxlvnxji`
3. Allez dans **Settings** → **API**
4. Trouvez **Service Role Key**
5. Cliquez sur **"Rotate Key"** ou **"Generate New Key"**
6. **Copiez la nouvelle clé** (vous en aurez besoin)

### 2. Stocker la Nouvelle Clé dans Supabase Vault

Connectez-vous à votre base de données Supabase et exécutez :

```sql
-- Activer l'extension vault si pas déjà fait
CREATE EXTENSION IF NOT EXISTS vault;

-- Stocker la nouvelle service_role_key (REMPLACEZ par votre vraie clé)
SELECT vault.create_secret(
  'VOTRE_NOUVELLE_SERVICE_ROLE_KEY_ICI',
  'supabase-service-role-key'
);

-- Vérifier que le secret est bien stocké
SELECT vault.read_secret('supabase-service-role-key');
```

### 3. Fermer l'Alerte GitHub

1. Allez sur : https://github.com/wilsan007/gantt-flow-supabase-baseline/security
2. Trouvez l'alerte **"Publicly leaked secret"**
3. Cliquez sur **"Close as revoked"**
4. Confirmez que vous avez révoqué la clé

## ✅ CORRECTION APPLIQUÉE

Le fichier `supabase/migrations/20251110_webhook_collaborator_confirmation.sql` a été modifié pour :

- ❌ **AVANT** : Clé hardcodée en clair
- ✅ **APRÈS** : Récupération depuis Supabase Vault

## 📋 VÉRIFICATION

Après avoir créé le secret dans Vault, testez la fonction :

```sql
-- Test manuel (remplacez par un vrai user_id)
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE id = 'UN_USER_ID_TEST';

-- Vérifiez les logs
SELECT * FROM pg_stat_statements WHERE query LIKE '%trigger_collaborator_confirmation%';
```

## 🔒 BONNES PRATIQUES

**NE JAMAIS :**

- ❌ Committer des clés API en dur
- ❌ Committer des tokens d'authentification
- ❌ Committer des mots de passe

**TOUJOURS :**

- ✅ Utiliser Supabase Vault pour PostgreSQL
- ✅ Utiliser GitHub Secrets pour CI/CD
- ✅ Utiliser variables d'environnement (.env)
- ✅ Ajouter `.env` dans `.gitignore`

## 📞 AIDE

Si vous avez des questions ou problèmes :

1. Vérifiez que l'extension `vault` est activée
2. Vérifiez les permissions de la fonction
3. Consultez : https://supabase.com/docs/guides/database/vault
