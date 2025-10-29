#!/bin/bash

# =====================================================
# Script de Test de l'Edge Function
# operational-instantiator
# =====================================================

set -e

echo "═══════════════════════════════════════════════════"
echo "🧪 TEST DE L'EDGE FUNCTION"
echo "═══════════════════════════════════════════════════"

# Charger les variables d'environnement
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

FUNCTION_URL="https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/operational-instantiator"

# Vérifier que la clé API est disponible
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEY non trouvée"
    echo "📝 Veuillez définir la variable dans .env"
    exit 1
fi

echo "✅ Variables d'environnement chargées"
echo ""
echo "📍 URL: $FUNCTION_URL"
echo ""
echo "⏳ Appel de la fonction..."
echo ""

# Appeler la fonction
response=$(curl -s -w "\n%{http_code}" \
    -X POST "$FUNCTION_URL" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json")

# Séparer le body et le code HTTP
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

echo "═══════════════════════════════════════════════════"
echo "📊 RÉSULTAT"
echo "═══════════════════════════════════════════════════"
echo "Status: $http_code"
echo ""
echo "$body" | jq '.' 2>/dev/null || echo "$body"
echo ""

if [ "$http_code" = "200" ]; then
    echo "✅ TEST RÉUSSI"
    
    # Afficher les statistiques
    tasks_generated=$(echo "$body" | jq -r '.tasks_generated' 2>/dev/null)
    tasks_skipped=$(echo "$body" | jq -r '.tasks_skipped' 2>/dev/null)
    errors=$(echo "$body" | jq -r '.errors' 2>/dev/null)
    
    if [ "$tasks_generated" != "null" ]; then
        echo ""
        echo "📊 Statistiques:"
        echo "   ✅ Tâches générées: $tasks_generated"
        echo "   ⏭️  Tâches ignorées: $tasks_skipped"
        echo "   ❌ Erreurs: $errors"
    fi
else
    echo "❌ TEST ÉCHOUÉ (HTTP $http_code)"
fi

echo "═══════════════════════════════════════════════════"
