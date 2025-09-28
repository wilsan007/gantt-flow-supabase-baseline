# 🧪 Instructions pour tester medtest1@yahoo.com

## ⚠️ Problème de connectivité réseau
L'environnement local ne peut pas se connecter à Supabase (erreur IPv6 ENETUNREACH). Vous devez exécuter le test depuis un environnement avec accès réseau à Supabase.

## 📋 Données de test
- **Email:** medtest1@yahoo.com
- **User ID:** bdef6cd4-3019-456b-aee4-a037dee6ff00
- **Tenant ID:** 06c8c1c4-c34c-4447-9f1c-39f0c17bdc75
- **Token:** 5420d45abc897c5219b1cc69d39c3821b23180629170680871664f4e
- **Mot de passe DB:** bykg4k993NDF1!

## 🚀 Méthodes de test disponibles

### Option 1: Script Bash (Recommandé)
```bash
./test-medtest1-psql.sh
```

### Option 2: Script SQL direct
```bash
psql "postgresql://postgres:bykg4k993NDF1!@db.qliinxtanjdnwxlvnxji.supabase.co:5432/postgres" -f test-medtest1-final.sql
```

### Option 3: Node.js avec .env
```bash
node test-medtest1-env.js
```

## 📊 Ce que le test vérifie

1. **Installation du trigger** - `fix-trigger-on-email-confirmation.sql`
2. **État initial** - Utilisateur et invitation existants
3. **Triggers installés** - Vérification des triggers de confirmation
4. **Simulation confirmation** - `UPDATE email_confirmed_at = now()`
5. **Résultats après trigger** :
   - ✅ Profil créé dans `public.profiles`
   - ✅ Employé créé dans `public.employees`  
   - ✅ Invitation acceptée (`status='accepted'`)
   - ✅ Rôles créés dans `user_roles`

## 🎯 Score attendu
**4/4** = 🎉 TRIGGER PARFAIT!

## 🔧 Si le test échoue

### Trigger non installé
```sql
\i fix-trigger-on-email-confirmation.sql
```

### Utilisateur manquant
L'utilisateur doit d'abord cliquer sur le lien de confirmation :
```
https://qliinxtanjdnwxlvnxji.supabase.co/auth/v1/verify?token=5420d45abc897c5219b1cc69d39c3821b23180629170680871664f4e&type=signup&redirect_to=http://localhost:8080/tenant-signup
```

### Invitation manquante
Vérifier que l'invitation existe dans `public.invitations` avec `email = 'medtest1@yahoo.com'`

## 📝 Fichiers créés pour le test

- `test-medtest1-psql.sh` - Script bash complet
- `test-medtest1-final.sql` - Script SQL pur  
- `test-medtest1-env.js` - Script Node.js avec .env
- `db-config.json` - Configuration de connexion
- `INSTRUCTIONS_TEST_MEDTEST1.md` - Ce fichier

## 🔍 Debug manuel

Si vous voulez déboguer manuellement :

```sql
-- Vérifier utilisateur
SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'medtest1@yahoo.com';

-- Vérifier invitation  
SELECT id, email, status, tenant_id FROM public.invitations WHERE email = 'medtest1@yahoo.com';

-- Vérifier triggers
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_schema = 'auth' AND event_object_table = 'users';

-- Forcer confirmation
UPDATE auth.users SET email_confirmed_at = now() WHERE email = 'medtest1@yahoo.com';

-- Vérifier résultats
SELECT COUNT(*) FROM public.profiles WHERE email = 'medtest1@yahoo.com';
SELECT COUNT(*) FROM public.employees WHERE email = 'medtest1@yahoo.com';
SELECT status FROM public.invitations WHERE email = 'medtest1@yahoo.com';
```

## ✅ Validation finale

Le trigger fonctionne correctement si après confirmation d'email :
1. Un profil est créé avec `role = 'tenant_admin'`
2. Un employé est créé avec `employee_id` unique
3. L'invitation passe à `status = 'accepted'`
4. Les rôles et permissions sont assignés automatiquement
