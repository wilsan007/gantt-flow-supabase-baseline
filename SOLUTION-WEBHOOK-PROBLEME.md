# 🚨 PROBLÈME WEBHOOK NE SE DÉCLENCHE PLUS

## 🔍 DIAGNOSTIC

Le webhook ne se déclenche plus du tout, alors qu'avant il s'exécutait (même avec erreurs).

## 🎯 CAUSES POSSIBLES

### 1. **Webhook pas configuré ou désactivé**
- Vérifiez dans Supabase Dashboard > Database > Webhooks
- Le webhook "email-confirmation-handler" existe-t-il ?

### 2. **URL webhook incorrecte**
- URL correcte: `https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation`
- Vérifiez que l'URL est exacte

### 3. **Conditions webhook trop restrictives**
- Condition: `email_confirmed_at IS NOT NULL`
- Table: `auth.users`
- Event: `UPDATE` uniquement

### 4. **Headers manquants**
- Authorization header requis
- Content-Type: application/json

## 🛠️ SOLUTIONS IMMÉDIATES

### **SOLUTION 1: Reconfigurer le webhook (RECOMMANDÉ)**

**Dans Supabase Dashboard:**
1. Aller sur: https://supabase.com/dashboard/project/qliinxtanjdnwxlvnxji
2. Database > Webhooks
3. Si webhook existe: le supprimer
4. Créer nouveau webhook:

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

### **SOLUTION 2: Trigger SQL (Alternative)**

Si le webhook HTTP ne fonctionne pas, utiliser un trigger PostgreSQL:

```sql
-- Créer fonction trigger
CREATE OR REPLACE FUNCTION handle_email_confirmation_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si email vient d'être confirmé
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
    -- Appeler l'Edge Function via HTTP
    PERFORM net.http_post(
      url := 'https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI'
      ),
      body := jsonb_build_object(
        'type', 'UPDATE',
        'table', 'users',
        'schema', 'auth',
        'record', to_jsonb(NEW),
        'old_record', to_jsonb(OLD)
      )
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer trigger
DROP TRIGGER IF EXISTS email_confirmation_trigger ON auth.users;
CREATE TRIGGER email_confirmation_trigger
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_email_confirmation_trigger();
```

### **SOLUTION 3: Test manuel du processus**

Pour tester si le problème vient du webhook ou de l'Edge Function:

```bash
# Tester directement l'Edge Function
curl -X POST https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI" \
  -d '{
    "type": "UPDATE",
    "table": "users",
    "record": {
      "id": "test-id",
      "email": "test@example.com",
      "email_confirmed_at": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
    }
  }'
```

## 🎯 ACTION IMMÉDIATE

**Vérifiez d'abord dans Supabase Dashboard > Database > Webhooks:**
- Le webhook existe-t-il ?
- Est-il activé ?
- L'URL est-elle correcte ?

Si le webhook n'existe pas ou est mal configuré, c'est la cause du problème !

## 📋 CHECKLIST DE VÉRIFICATION

- [ ] Webhook existe dans Dashboard
- [ ] URL correcte: `/functions/v1/handle-email-confirmation`
- [ ] Event: UPDATE sur auth.users
- [ ] Condition: email_confirmed_at IS NOT NULL
- [ ] Headers Authorization configuré
- [ ] Edge Function déployée (✅ confirmé)

**Le problème est très probablement dans la configuration du webhook dans le Dashboard !**
