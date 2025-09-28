-- Vérifier si le trigger auto_tenant_creation_trigger est installé
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'auto_tenant_creation_trigger';

-- Vérifier si la fonction auto_create_tenant_owner existe
SELECT 
  proname as function_name,
  pronargs as num_args
FROM pg_proc 
WHERE proname = 'auto_create_tenant_owner';
