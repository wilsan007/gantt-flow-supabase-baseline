# 🔗 CONFIGURATION WEBHOOK DANS SUPABASE DASHBOARD

## 📍 Étapes pour configurer le webhook :

1. **Aller dans Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/qliinxtanjdnwxlvnxji

2. **Naviguer vers Database > Webhooks**
   - Menu gauche → Database → Webhooks

3. **Créer un nouveau webhook**
   - Cliquer "Create a new hook"

4. **Configuration:**
   ```
   Name: email-confirmation-handler
   Table: auth.users
   Events: ☑️ Update (décocher Insert et Delete)
   Type: HTTP Request
   Method: POST
   URL: https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation
   
   HTTP Headers:
   - Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI
   - Content-Type: application/json
   
   Conditions:
   - Column: email_confirmed_at
   - Operator: IS NOT NULL
   ```

5. **Sauvegarder**

## ✅ Résultat attendu :
- Confirmation email → webhook → Edge Function → création automatique
