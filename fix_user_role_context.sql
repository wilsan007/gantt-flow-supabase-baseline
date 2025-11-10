-- ================================================================
-- FIX: Ajouter context_type et context_id pour l'utilisateur HR Manager
-- ================================================================

-- Mettre à jour le rôle existant
UPDATE public.user_roles 
SET 
  context_type = 'tenant',
  context_id = tenant_id,
  updated_at = now()
WHERE user_id = 'd12891c4-77b1-484b-9236-3f627bde976e'
  AND (context_type IS NULL OR context_id IS NULL);

-- Vérifier le résultat
SELECT 
  ur.id,
  ur.user_id,
  r.name as role_name,
  r.display_name as role_display,
  ur.tenant_id,
  ur.context_type,
  ur.context_id,
  ur.is_active
FROM public.user_roles ur
JOIN public.roles r ON ur.role_id = r.id
WHERE ur.user_id = 'd12891c4-77b1-484b-9236-3f627bde976e';
