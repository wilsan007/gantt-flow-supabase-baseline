-- Diagnostic: Vérifier si des templates d action existent
-- Exécutez cette requête dans le SQL Editor

SELECT 
  id,
  title,
  description,
  created_at
FROM operational_action_templates
ORDER BY created_at DESC
LIMIT 10;

-- Si cette requête retourne 0 lignes, c'est normal: vous n'avez pas encore créé de templates
-- Dans ce cas, le bouton "Ajouter des preuves" ne devrait apparaître que quand un template existe
