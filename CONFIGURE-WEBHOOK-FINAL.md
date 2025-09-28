# 🔧 CONFIGURATION WEBHOOK FINALE

## ✅ DIAGNOSTIC CONFIRMÉ
- ✅ Edge Function fonctionne parfaitement (test direct réussi)
- ✅ Utilisateur test0071@yahoo.com configuré avec succès
- ✅ Tenant, profil, employé EMP022 créés
- ❌ **PROBLÈME**: Webhook automatique manquant

## 🎯 SOLUTION: Configurer le Webhook dans Supabase Dashboard

### Étapes à suivre:

1. **Aller dans Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Projet: qliinxtanjdnwxlvnxji

2. **Naviguer vers Database > Webhooks**
   - Cliquer sur "Database" dans le menu gauche
   - Cliquer sur "Webhooks"

3. **Créer un nouveau webhook**
   - Cliquer sur "Create a new hook"
   
4. **Configuration du webhook:**
   ```
   Name: Email Confirmation Handler
   Table: auth.users
   Events: ☑️ Update (décocher Insert et Delete)
   Type: HTTP Request
   HTTP Method: POST
   URL: https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation
   HTTP Headers: 
     - Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI
     - Content-Type: application/json
   
   Conditions: 
     - Column: email_confirmed_at
     - Operator: IS NOT NULL
   ```

5. **Sauvegarder le webhook**

## 🧪 TEST APRÈS CONFIGURATION

Une fois le webhook configuré, tester avec:

```bash
# 1. Nettoyer l'utilisateur test
node cleanup-test-user.js

# 2. Créer une nouvelle invitation
# 3. Créer un nouvel utilisateur  
# 4. Confirmer l'email via le lien Supabase
# 5. Vérifier que l'Edge Function se déclenche automatiquement
```

## 🎉 RÉSULTAT ATTENDU

Après configuration du webhook:
- ✅ Confirmation email → déclenchement automatique Edge Function
- ✅ Création automatique tenant, profil, employé
- ✅ Attribution rôles automatique
- ✅ Mise à jour invitation automatique

## 🔍 VÉRIFICATION

L'Edge Function a déjà prouvé qu'elle fonctionne:
- Utilisateur: 1e84afd9-0544-4197-b364-8ecdcd93cea1
- Email: test0071@yahoo.com  
- Tenant: 0d63a920-937f-4b2b-9c4e-65f610a3fca6
- Employee ID: EMP022
- Rôle: tenant_admin

**Le système est prêt, il ne manque que la configuration du webhook !**
