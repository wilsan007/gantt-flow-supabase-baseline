# 🔴 RÉSOLUTION ERREUR - "Database error creating new user"

**Date** : 31 octobre 2025 16:53 UTC+03:00  
**Erreur** : `AuthApiError: Database error creating new user`  
**Code** : `unexpected_failure`

---

## 🔍 DIAGNOSTIC

### Erreur Actuelle

```
❌ Erreur création utilisateur: AuthApiError: Database error creating new user
   at send-collaborator-invitation/index.ts:248:55
   status: 500
   code: "unexpected_failure"
```

### Cause Identifiée

**Un trigger SQL automatique existe encore sur la table `auth.users`** qui :

1. Se déclenche lors de la création d'utilisateur
2. Essaie de créer automatiquement un profile
3. Échoue car le tenant_id n'est pas encore disponible
4. Fait échouer toute la transaction

---

## ✅ SOLUTION - Supprimer les Triggers

### ÉTAPE 1 : Accéder au SQL Editor

1. Ouvrir : https://supabase.com/dashboard/project/qliinxtanjdnwxlvnxji
2. Cliquer sur **SQL Editor** dans le menu gauche
3. Cliquer **New query** (nouvelle requête)

---

### ÉTAPE 2 : Exécuter le Script SQL

**Copier-coller ce code dans l'éditeur** :

```sql
-- ============================================================================
-- SUPPRESSION DES TRIGGERS SUR auth.users
-- ============================================================================

-- Supprimer tous les triggers possibles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS handle_email_confirmation_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_user_updated ON auth.users;
DROP TRIGGER IF EXISTS trg_handle_new_user ON auth.users;

-- Supprimer toutes les fonctions de trigger
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_email_confirmation_webhook() CASCADE;
DROP FUNCTION IF EXISTS public.on_auth_user_created() CASCADE;
DROP FUNCTION IF EXISTS public.notify_email_confirmation() CASCADE;
DROP FUNCTION IF EXISTS public.setup_auth_webhook() CASCADE;
DROP FUNCTION IF EXISTS public.handle_auth_user_created() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_handle_new_user() CASCADE;

-- Vérifier qu'il n'y a plus de triggers
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- Si le résultat est vide, c'est parfait ✅
```

---

### ÉTAPE 3 : Cliquer "Run" (Exécuter)

1. Cliquer le bouton **Run** en bas à droite
2. Attendre l'exécution (1-2 secondes)
3. Vérifier le résultat

---

### ÉTAPE 4 : Vérifier le Résultat

**Cas 1 : Résultat vide (0 rows)**
```
✅ Parfait ! Aucun trigger restant.
✅ Le problème est résolu.
```

**Cas 2 : Des triggers apparaissent**
```
⚠️ Notez les noms des triggers
⚠️ Exécutez pour chacun:
   DROP TRIGGER IF EXISTS [nom_du_trigger] ON auth.users;
```

---

### ÉTAPE 5 : Tester l'Invitation

**Retester l'invitation collaborateur** :

1. Aller dans l'application
2. Inviter un collaborateur
3. Vérifier qu'il n'y a plus d'erreur

**Résultat attendu** :
```
✅ Invitation envoyée avec succès
✅ Email reçu
✅ Aucune erreur "Database error"
```

---

## 🔍 VÉRIFICATION WEBHOOK DASHBOARD

### Également Vérifier les Webhooks

**En parallèle, vérifier** :

1. Aller dans **Database** → **Webhooks**
2. Chercher webhook sur table `auth.users`
3. Si trouvé → **Désactiver** ou **Supprimer**

---

## 📊 POURQUOI CE PROBLÈME ?

### Ancien Système

```
User créé
  ↓
TRIGGER SQL automatique se déclenche
  ↓
Essaie de créer profile immédiatement
  ↓
❌ ÉCHOUE (tenant_id pas encore disponible)
  ↓
Transaction rollback
  ↓
❌ User PAS créé
```

### Nouveau Système (Après Fix)

```
User temporaire créé (temp_user: true)
  ↓
Aucun trigger automatique ✅
  ↓
Email Magic Link envoyé ✅
  ↓
User clique lien
  ↓
AuthCallback traite et crée profile AU BON MOMENT ✅
```

---

## 🎯 CHECKLIST COMPLÈTE

### Avant de Tester

- [ ] SQL exécuté dans Dashboard
- [ ] Vérification : 0 triggers restants
- [ ] Webhook Dashboard désactivé (si présent)
- [ ] Logs vérifiés (aucune erreur)

### Test Fonctionnel

- [ ] Invitation collaborateur testée
- [ ] Email reçu avec Magic Link
- [ ] Clic Magic Link fonctionne
- [ ] Profile créé correctement
- [ ] Accès dashboard OK

---

## 🔧 EN CAS DE PROBLÈME PERSISTANT

### Si l'erreur revient

**Vérifier à nouveau** :

```sql
-- Lister TOUS les triggers sur auth.users
SELECT 
  t.trigger_name,
  t.event_manipulation,
  t.action_timing,
  p.proname as function_name
FROM information_schema.triggers t
JOIN pg_proc p ON p.oid = t.action_statement::regproc
WHERE t.event_object_schema = 'auth'
  AND t.event_object_table = 'users';
```

**Supprimer chacun manuellement** :
```sql
DROP TRIGGER [nom_exact_du_trigger] ON auth.users;
```

---

## 📝 FICHIERS CRÉÉS

Pour vous aider, j'ai créé :

1. **EXECUTE_THIS_SQL.sql** - Script SQL complet à exécuter
2. **Ce document** - Guide étape par étape
3. **Migrations** - Pour référence future

---

## ✅ RÉSULTAT ATTENDU FINAL

Après exécution du script SQL :

```
┌────────────────────────────────────────────────┐
│  ✅ SYSTÈME FONCTIONNEL                        │
│                                                │
│  Invitation collaborateur :                    │
│  - User créé sans erreur ✅                    │
│  - Email envoyé ✅                             │
│  - Magic Link fonctionne ✅                    │
│  - Profile créé au bon moment ✅               │
│                                                │
│  Invitation tenant owner :                     │
│  - User créé sans erreur ✅                    │
│  - Email envoyé ✅                             │
│  - Magic Link fonctionne ✅                    │
│  - Tenant créé correctement ✅                 │
│                                                │
│  ❌ Plus d'erreur "Database error" ✅          │
└────────────────────────────────────────────────┘
```

---

## 🚀 ACTION IMMÉDIATE

**MAINTENANT** :

1. ✅ Ouvrir Supabase Dashboard
2. ✅ Aller dans SQL Editor
3. ✅ Copier le script SQL
4. ✅ Exécuter (Run)
5. ✅ Vérifier 0 triggers
6. ✅ Retester invitation

**Temps estimé** : 2 minutes

---

**Le problème sera résolu après exécution du script SQL !** 🎯
