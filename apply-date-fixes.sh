#!/bin/bash

# Script pour appliquer les corrections de dates
# Usage: ./apply-date-fixes.sh

echo "🔧 Application des corrections de dates..."
echo ""

# Charger les variables d'environnement
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Vérifier que les variables sont définies
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Variables d'environnement manquantes"
  echo "Assurez-vous que SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définis dans .env"
  exit 1
fi

echo "✅ Variables d'environnement chargées"
echo ""

# Extraire le project ID de l'URL
PROJECT_ID=$(echo $SUPABASE_URL | sed 's/https:\/\/\(.*\)\.supabase\.co/\1/')

echo "📊 Projet Supabase: $PROJECT_ID"
echo ""

# Appliquer les migrations
echo "1️⃣ Application de la migration: fix_task_dates_alignment.sql"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

npx supabase db push --db-url "postgresql://postgres:$SUPABASE_SERVICE_ROLE_KEY@db.$PROJECT_ID.supabase.co:5432/postgres" \
  --include-all \
  --include-seed=false

if [ $? -eq 0 ]; then
  echo "✅ Migration appliquée avec succès"
else
  echo "❌ Erreur lors de l'application de la migration"
  exit 1
fi

echo ""
echo "2️⃣ Vérification des résultats..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Exécuter le script de vérification
node check-project-dates.js

echo ""
echo "✅ Corrections appliquées avec succès !"
echo ""
echo "💡 Les contraintes de validation sont maintenant actives."
echo "   Toute tentative d'ajouter une tâche en dehors de la plage du projet sera rejetée."
