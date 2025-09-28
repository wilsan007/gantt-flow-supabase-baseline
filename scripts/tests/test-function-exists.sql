-- Vérifier si la fonction create_tenant_owner_from_invitation existe
SELECT 
  proname as function_name,
  pronargs as num_args,
  proargnames as arg_names,
  proargtypes::regtype[] as arg_types
FROM pg_proc 
WHERE proname = 'create_tenant_owner_from_invitation';

-- Vérifier aussi les fonctions similaires
SELECT 
  proname as function_name,
  pronargs as num_args
FROM pg_proc 
WHERE proname LIKE '%tenant_owner%' OR proname LIKE '%employee_id%';
