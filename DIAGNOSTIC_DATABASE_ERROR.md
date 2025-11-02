# 🔍 DIAGNOSTIC - "Database error creating new user"

**Date** : 31 octobre 2025 16:16 UTC+03:00  
**Erreur** : `AuthApiError: Database error creating new user`  
**Code** : `unexpected_failure`  
**Status** : 500

---

## ⚠️ ANALYSE DU PROBLÈME

### Erreur Complète

```
❌ Erreur création utilisateur: AuthApiError: Database error creating new user
    at et (https://esm.sh/@supabase/auth-js@2.78.0/es2022/auth-js.mjs:3:8552)
    at eventLoopTick (ext:core/01_core.js:175:7)
    at async Ct (https://esm.sh/@supabase/auth-js@2.78.0/es2022/auth-js.mjs:3:9397)
    at async g (https://esm.sh/@supabase/auth-js@2.78.0/es2022/auth-js.mjs:3:9116)
    at async K.createUser (https://esm.sh/@supabase/auth-js@2.78.0/es2022/auth-js.mjs:3:12054)
    at async Server.<anonymous> (file:///var/tmp/sb-compile-edge-runtime/functions/send-collaborator-invitation/index.ts:248:55)
```

### Contexte

- **Fonction** : `send-collaborator-invitation`
- **Action** : Création d'un utilisateur collaborateur
- **Ligne** : 248 (appel `createUser`)

---

## 🔍 CAUSES POSSIBLES

### 1. Webhook Automatique sur auth.users ⚠️ (PROBABLE)

**Hypothèse** : Un webhook Supabase est configuré pour se déclencher automatiquement à chaque création d'utilisateur et tente de créer un profile.

**Problème** :
- Le webhook se déclenche **avant** que les métadonnées ne soient complètes
- Il essaie de créer un profile sans `tenant_id` ou autres champs requis
- La contrainte `NOT NULL` sur `profiles.tenant_id` fait échouer l'insertion
- L'échec du webhook fait échouer toute la transaction de création d'utilisateur

**Vérification** :
```sql
-- Vérifier les webhooks configurés
SELECT * FROM supabase_functions.hooks;

-- Ou dans le Dashboard Supabase
-- Database → Webhooks → Vérifier si un webhook existe sur auth.users
```

---

### 2. Trigger Database sur auth.users ❌ (ÉLIMINÉ)

**Hypothèse** : Un trigger SQL s'exécute automatiquement après INSERT sur auth.users.

**Vérification effectuée** :
```sql
-- Recherche de triggers sur auth.users
SELECT * FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass;
```

**Résultat** : Aucun trigger trouvé dans les migrations ✅

---

### 3. Contrainte NOT NULL sur profiles.tenant_id ⚠️ (POSSIBLE)

**Hypothèse** : Si un processus automatique essaie de créer un profile, la contrainte `tenant_id NOT NULL` bloque.

**Vérification** :
```sql
-- Vérifier la structure de la table profiles
SELECT column_name, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'tenant_id';
```

---

### 4. RLS (Row Level Security) sur auth.users ❌ (PEU PROBABLE)

**Hypothèse** : Une politique RLS bloque la création.

**Vérification** :
```sql
-- Les politiques RLS sur auth.users sont gérées par Supabase
-- Normalement, auth.admin.createUser bypass les RLS
```

**Résultat** : Peu probable car nous utilisons Service Role Key ✅

---

## ✅ SOLUTION RECOMMANDÉE

### Solution 1 : Désactiver le Webhook Automatique (IMMÉDIAT)

**Si un webhook est configuré sur auth.users** :

1. Aller dans **Supabase Dashboard**
2. **Database** → **Webhooks**
3. Trouver le webhook sur la table `auth.users`
4. **Désactiver** ou **Supprimer** le webhook

**Raison** :
- Les utilisateurs collaborateurs sont créés avec des métadonnées **temporaires**
- Le webhook `handle-collaborator-confirmation` doit être appelé **manuellement** par AuthCallback
- Pas de création automatique de profile nécessaire

---

### Solution 2 : Modifier le Webhook pour Ignorer les Utilisateurs Temporaires

**Si le webhook doit rester actif** :

Ajouter une condition dans `handle-collaborator-confirmation/index.ts` :

```typescript
// Au début de la fonction
const isTempUser = user?.raw_user_meta_data?.temp_user;
const invitationType = user?.raw_user_meta_data?.invitation_type;

if (isTempUser && invitationType === 'collaborator') {
  console.log('⏭️ Utilisateur temporaire - traitement manuel uniquement');
  return new Response(JSON.stringify({
    message: 'Utilisateur temporaire - webhook ignoré',
    note: 'Sera traité par AuthCallback lors du clic sur Magic Link'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
```

---

### Solution 3 : Rendre tenant_id NULLABLE Temporairement

**Modification de la table profiles** :

```sql
-- Permettre NULL temporairement
ALTER TABLE profiles 
ALTER COLUMN tenant_id DROP NOT NULL;

-- Ajouter une contrainte CHECK à la place
ALTER TABLE profiles 
ADD CONSTRAINT check_tenant_id_for_non_temp 
CHECK (
  (user_id IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'temp_user' = 'true'
  )) 
  OR tenant_id IS NOT NULL
);
```

**⚠️ NON RECOMMANDÉ** : Cela affaiblit l'intégrité des données.

---

## 🧪 TESTS DE DIAGNOSTIC

### Test 1 : Vérifier les Webhooks Actifs

**Dashboard Supabase** :
1. Aller dans **Database** → **Webhooks**
2. Chercher webhook sur table `auth.users`
3. Noter son statut (enabled/disabled)

**Résultat attendu** :
- Si webhook trouvé → **C'est la cause** ⚠️
- Si aucun webhook → Passer au test 2

---

### Test 2 : Créer un Utilisateur Test Directement

**Dans SQL Editor** :

```sql
-- Test de création directe
SELECT auth.admin_create_user(
  email := 'test-direct@example.com',
  password := 'TestPassword123!',
  email_confirm := true,
  user_metadata := jsonb_build_object(
    'full_name', 'Test Direct',
    'temp_user', true,
    'invitation_type', 'collaborator',
    'tenant_id', '00000000-0000-0000-0000-000000000000'
  )
);
```

**Si erreur** :
- Vérifier le message exact
- Cela confirme un problème au niveau database

**Si succès** :
- Le problème vient des métadonnées ou du contexte d'exécution

---

### Test 3 : Logs Supabase Détaillés

**Dashboard** → **Logs** → **Postgres Logs**

Chercher :
- Erreurs autour du timestamp `2025-10-31T13:15:49.055Z`
- Messages contenant `profiles`, `tenant_id`, ou `INSERT`

---

## 📋 CHECKLIST DE RÉSOLUTION

### Étape 1 : Vérification

- [ ] Vérifier webhooks dans Dashboard Supabase
- [ ] Vérifier logs Postgres autour de 13:15:49 UTC
- [ ] Tester création utilisateur directe en SQL
- [ ] Vérifier structure table profiles (tenant_id nullable?)

### Étape 2 : Action Immédiate

**Si webhook trouvé** :
- [ ] Désactiver le webhook sur auth.users
- [ ] Retester invitation collaborateur
- [ ] Vérifier création utilisateur réussie

**Si pas de webhook** :
- [ ] Analyser logs Postgres détaillés
- [ ] Vérifier contraintes sur profiles
- [ ] Vérifier triggers non documentés

### Étape 3 : Validation

- [ ] Envoyer nouvelle invitation collaborateur
- [ ] Vérifier utilisateur créé sans erreur
- [ ] Vérifier email reçu avec Magic Link
- [ ] Tester clic Magic Link
- [ ] Vérifier profile créé par webhook manuel

---

## 🔗 COMMANDES UTILES

### Vérifier Webhooks (SQL)

```sql
-- Si table existe (dépend version Supabase)
SELECT * FROM supabase_functions.hooks 
WHERE table_name = 'users' 
  AND schema_name = 'auth';
```

### Vérifier Triggers

```sql
-- Liste tous les triggers sur auth.users
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';
```

### Vérifier Contraintes profiles

```sql
-- Structure complète de profiles
\d+ profiles;

-- Ou
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```

---

## 💡 RECOMMANDATION FINALE

### Action Prioritaire

**1. Vérifier et désactiver webhook automatique sur auth.users**

**Justification** :
- Le flux collaborateur utilise un webhook **manuel** (appelé par AuthCallback)
- Un webhook automatique interfère avec la création d'utilisateurs temporaires
- Les métadonnées ne sont pas toutes disponibles au moment de la création

### Architecture Correcte

```
1. send-collaborator-invitation crée user
   - email_confirm: true
   - user_metadata: {...} (complet)
   - ❌ PAS de webhook automatique
   ↓
2. Email envoyé avec Magic Link
   ↓
3. Collaborateur clique lien
   ↓
4. AuthCallback détecte invitation='collaborator'
   ↓
5. ✅ Appel MANUEL de handle-collaborator-confirmation
   via URL webhook ou fonction edge
   ↓
6. Webhook crée profile + employee
   ↓
7. Redirection /dashboard
```

---

## 📄 PROCHAINES ÉTAPES

1. **Vérifier Dashboard Webhooks** (URGENT)
2. **Désactiver webhook automatique** si trouvé
3. **Retester invitation** collaborateur
4. **Documenter la configuration** webhook correcte
5. **Mettre à jour documentation** système

---

**Le problème est très probablement un webhook automatique configuré dans Supabase Dashboard qui entre en conflit avec notre flux manuel.** 🎯
