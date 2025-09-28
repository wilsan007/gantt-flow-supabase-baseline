# 🔗 WEBHOOK SUPABASE - SOLUTION SIMPLE

## ❌ PAS BESOIN D'AUTH0 !

Votre système Supabase fonctionne déjà parfaitement. Auth0 est un service complètement différent qui nécessiterait une migration complète.

## ✅ SOLUTION SUPABASE (5 minutes)

### Étapes simples :

1. **Ouvrir Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/qliinxtanjdnwxlvnxji
   - Se connecter avec votre compte

2. **Aller dans Database > Webhooks**
   - Menu gauche → Database
   - Cliquer sur "Webhooks"

3. **Créer le webhook**
   - Cliquer "Create a new hook"
   - Remplir le formulaire :

```
Name: email-confirmation-handler
Table: auth.users
Events: ☑️ Update (décocher les autres)
Type: HTTP Request
Method: POST
URL: https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation

HTTP Headers:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI
Content-Type: application/json

Conditions:
Column: email_confirmed_at
Operator: IS NOT NULL
```

4. **Sauvegarder**

5. **Tester**
   ```bash
   node test-webhook-after-config.js
   ```

## 🎉 RÉSULTAT

Après cette configuration (5 minutes) :
- ✅ Confirmation email → déclenchement automatique Edge Function
- ✅ Création automatique tenant/profil/employé
- ✅ Système 100% fonctionnel

## 🚫 POURQUOI PAS AUTH0

- Votre système Supabase fonctionne déjà
- Auth0 nécessiterait une réécriture complète
- Plus complexe et coûteux
- Pas nécessaire pour votre cas

**Restez avec Supabase, configurez juste le webhook !**
