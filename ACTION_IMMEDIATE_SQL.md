# 🚨 ACTION IMMÉDIATE - Exécuter ce SQL MAINTENANT

**Erreur actuelle** : `Database error creating new user`  
**Solution** : Supprimer les triggers automatiques sur auth.users

---

## ⚡ ÉTAPES RAPIDES (2 MINUTES)

### 1. Ouvrir SQL Editor
👉 https://supabase.com/dashboard/project/qliinxtanjdnwxlvnxji/sql

### 2. Copier ce code

```sql
-- Supprimer tous les triggers sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS handle_email_confirmation_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_user_updated ON auth.users;
DROP TRIGGER IF EXISTS trg_handle_new_user ON auth.users;

-- Supprimer les fonctions de trigger
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_email_confirmation_webhook() CASCADE;
DROP FUNCTION IF EXISTS public.on_auth_user_created() CASCADE;
DROP FUNCTION IF EXISTS public.notify_email_confirmation() CASCADE;
DROP FUNCTION IF EXISTS public.setup_auth_webhook() CASCADE;
DROP FUNCTION IF EXISTS public.handle_auth_user_created() CASCADE;

-- Vérifier qu'il n'y a plus de triggers
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';
```

### 3. Cliquer "RUN"

### 4. Vérifier le résultat

**Si 0 rows** → ✅ Parfait !  
**Si des triggers apparaissent** → Notez les noms et supprimez-les manuellement

### 5. Retester l'invitation

Inviter un nouveau collaborateur → Devrait fonctionner ✅

---

## 📋 AUSSI : Vérifier Webhooks Dashboard

1. **Database** → **Webhooks**
2. Chercher webhook sur `auth.users`
3. Si trouvé → **Désactiver**

---

## ✅ RÉSULTAT ATTENDU

Après exécution :
- ✅ Invitation collaborateur fonctionne
- ✅ Plus d'erreur "Database error"
- ✅ Email envoyé correctement
- ✅ Magic Link fonctionne

---

**Exécutez ce SQL maintenant pour résoudre le problème !** 🚀
