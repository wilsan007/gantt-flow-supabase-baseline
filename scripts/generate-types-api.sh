#!/bin/bash

# =====================================================
# Génération des Types Supabase via API
# Alternative sans login interactif
# =====================================================

set -e

echo "═══════════════════════════════════════════════════"
echo "🔧 GÉNÉRATION DES TYPES SUPABASE (via API)"
echo "═══════════════════════════════════════════════════"

PROJECT_ID="qliinxtanjdnwxlvnxji"

# Créer le répertoire s'il n'existe pas
mkdir -p src/integrations/supabase

echo "📝 Génération des types TypeScript..."
echo ""

# Générer via API (nécessite Supabase CLI)
supabase gen types typescript --project-id $PROJECT_ID --schema public > src/integrations/supabase/types.ts 2>&1 || {
    echo ""
    echo "❌ La génération via API a échoué."
    echo ""
    echo "📋 Solutions alternatives:"
    echo ""
    echo "1️⃣  Via Dashboard Supabase:"
    echo "   - Aller sur: https://supabase.com/dashboard/project/$PROJECT_ID/api"
    echo "   - Section 'TypeScript Types'"
    echo "   - Copier le code généré"
    echo "   - Coller dans: src/integrations/supabase/types.ts"
    echo ""
    echo "2️⃣  Via mot de passe DB:"
    echo "   - Récupérer le mot de passe: Dashboard > Settings > Database"
    echo "   - Exécuter: supabase link --project-ref $PROJECT_ID"
    echo "   - Puis: npm run db:types"
    echo ""
    echo "3️⃣  Ignorer temporairement (utiliser 'as any'):"
    echo "   - Les types seront générés plus tard"
    echo "   - L'app fonctionnera quand même"
    echo ""
    exit 1
}

echo ""
echo "═══════════════════════════════════════════════════"
echo "✅ TYPES GÉNÉRÉS AVEC SUCCÈS"
echo "═══════════════════════════════════════════════════"
echo ""
echo "📁 Fichier: src/integrations/supabase/types.ts"
echo ""
