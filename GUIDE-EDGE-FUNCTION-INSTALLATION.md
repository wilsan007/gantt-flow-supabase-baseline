# Guide d'Installation - Edge Function de Confirmation d'Email

Ce guide explique comment installer et configurer l'Edge Function pour automatiser la création de tenant owner lors de la confirmation d'email.

## 📋 Vue d'ensemble

L'Edge Function `handle-email-confirmation` automatise complètement le processus :

1. **Détection** : Webhook déclenché quand `email_confirmed_at` passe de NULL à une valeur
2. **Validation** : Vérification de l'invitation tenant_owner
3. **Création tenant** : Création du tenant avec les informations de l'invitation
4. **Attribution rôle** : Attribution du rôle `tenant_admin` dans `user_roles`
5. **Création profil** : Enregistrement dans la table `profiles`
6. **Création employé** : Enregistrement dans la table `employees` avec `employee_id` unique
7. **Mise à jour invitation** : Marquage de l'invitation comme `accepted`

## 🚀 Installation

### Étape 1: Déployer l'Edge Function

```bash
# Rendre le script exécutable
chmod +x deploy-edge-function.sh

# Exécuter le déploiement
./deploy-edge-function.sh
```

### Étape 2: Configurer la base de données

Exécuter dans Supabase Dashboard > SQL Editor :

```sql
-- Exécuter le contenu de setup-email-confirmation-webhook.sql
\i setup-email-confirmation-webhook.sql
```

### Étape 3: Configurer le Webhook

Dans Supabase Dashboard > Database > Webhooks :

1. **Créer un nouveau webhook** avec :
   - **Table** : `auth.users`
   - **Events** : `UPDATE`
   - **Conditions** : `email_confirmed_at IS NOT NULL`
   - **URL** : `https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation`
   - **HTTP Headers** : 
     ```
     Authorization: Bearer [VOTRE_SERVICE_ROLE_KEY]
     Content-Type: application/json
     ```

## 🧪 Tests

### Test automatique complet

```bash
node test-edge-function-complete.js
```

### Test manuel avec fonction SQL

```sql
-- Tester avec un utilisateur existant
SELECT force_create_tenant_owner('email@example.com');

-- Vérifier les résultats
SELECT 
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  p.user_id IS NOT NULL as profile_created,
  e.user_id IS NOT NULL as employee_created,
  t.id IS NOT NULL as tenant_created
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN employees e ON u.id = e.user_id
LEFT JOIN tenants t ON p.tenant_id = t.id
WHERE u.email = 'email@example.com';
```

## 🔧 Dépannage

### Problème 1: Edge Function ne se déclenche pas

**Vérifications :**
1. Webhook configuré correctement dans Database > Webhooks
2. URL de l'Edge Function correcte
3. Headers d'autorisation présents

**Solution :**
```sql
-- Tester le trigger manuellement
SELECT test_edge_function_webhook('email@example.com');
```

### Problème 2: Erreur "Invitation non trouvée"

**Vérifications :**
1. Invitation existe avec `invitation_type = 'tenant_owner'`
2. Invitation a le statut `pending`
3. Invitation pas expirée

**Solution :**
```sql
-- Vérifier les invitations
SELECT * FROM invitations 
WHERE email = 'email@example.com' 
AND invitation_type = 'tenant_owner';

-- Réactiver une invitation expirée
UPDATE invitations 
SET status = 'pending', expires_at = now() + interval '7 days'
WHERE email = 'email@example.com';
```

### Problème 3: Erreur "Rôle tenant_admin non trouvé"

**Solution :**
```sql
-- Créer le rôle s'il n'existe pas
INSERT INTO roles (name, display_name, description)
VALUES ('tenant_admin', 'Administrateur Tenant', 'Administrateur d''un tenant')
ON CONFLICT (name) DO NOTHING;
```

### Problème 4: Email pas confirmé automatiquement

**Solution manuelle :**
```sql
-- Confirmer l'email manuellement
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email = 'email@example.com';
```

## 📊 Monitoring

### Logs de l'Edge Function

Dans Supabase Dashboard > Edge Functions > handle-email-confirmation > Logs

### Vérifier les notifications

```sql
-- Écouter les notifications (dans psql)
LISTEN email_confirmed;

-- Voir les notifications récentes
SELECT * FROM pg_stat_activity 
WHERE query LIKE '%email_confirmed%';
```

### Statistiques d'utilisation

```sql
-- Compter les créations réussies
SELECT 
  COUNT(*) as total_confirmations,
  COUNT(CASE WHEN p.user_id IS NOT NULL THEN 1 END) as successful_creations
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE u.email_confirmed_at IS NOT NULL
AND u.created_at > now() - interval '30 days';
```

## 🔄 Processus de Fallback

Si l'Edge Function échoue, utilisez la fonction SQL de fallback :

```sql
-- Pour un utilisateur spécifique
SELECT force_create_tenant_owner('email@example.com');

-- Pour tous les utilisateurs avec invitation en attente
DO $$
DECLARE
  user_email TEXT;
BEGIN
  FOR user_email IN 
    SELECT DISTINCT i.email
    FROM invitations i
    JOIN auth.users u ON i.email = u.email
    WHERE i.invitation_type = 'tenant_owner'
    AND i.status = 'pending'
    AND u.email_confirmed_at IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = u.id)
  LOOP
    PERFORM force_create_tenant_owner(user_email);
    RAISE NOTICE 'Traité: %', user_email;
  END LOOP;
END $$;
```

## ✅ Validation du Système

Le système est correctement installé si :

1. ✅ Edge Function déployée et accessible
2. ✅ Webhook configuré et actif
3. ✅ Trigger SQL installé
4. ✅ Test automatique réussi (score 5/5)
5. ✅ Logs Edge Function sans erreur

## 📞 Support

En cas de problème persistant :

1. Vérifier les logs Edge Function
2. Tester avec la fonction SQL de fallback
3. Vérifier la configuration du webhook
4. Consulter les logs PostgreSQL pour les triggers
