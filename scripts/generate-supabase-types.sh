#!/bin/bash

# =====================================================
# Script de Génération des Types Supabase
# Régénère les types TypeScript depuis la base de données
# =====================================================

set -e

echo "═══════════════════════════════════════════════════"
echo "🔧 GÉNÉRATION DES TYPES SUPABASE"
echo "═══════════════════════════════════════════════════"

# Vérifier que Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI n'est pas installé"
    echo "📦 Installation: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI trouvé"
echo ""

# Vérifier la connexion au projet
echo "🔍 Vérification de la connexion au projet..."
if ! supabase status &> /dev/null; then
    echo "⚠️  Pas encore lié à un projet Supabase"
    echo "🔗 Lien: supabase link --project-ref qliinxtanjdnwxlvnxji"
    read -p "Voulez-vous le faire maintenant? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        supabase link --project-ref qliinxtanjdnwxlvnxji
    else
        exit 1
    fi
fi

echo "✅ Connecté au projet"
echo ""

# Générer les types
echo "📝 Génération des types TypeScript depuis la base de données..."
echo ""

# Créer le répertoire s'il n'existe pas
mkdir -p src/integrations/supabase

# Générer les types
supabase gen types typescript --project-id qliinxtanjdnwxlvnxji > src/integrations/supabase/types.ts

# Vérifier le résultat
if [ $? -eq 0 ]; then
    echo ""
    echo "═══════════════════════════════════════════════════"
    echo "✅ TYPES GÉNÉRÉS AVEC SUCCÈS"
    echo "═══════════════════════════════════════════════════"
    echo ""
    echo "📁 Fichier créé: src/integrations/supabase/types.ts"
    echo ""
    echo "🔍 Vérification des nouvelles tables..."
    
    # Vérifier que les nouvelles tables sont présentes
    if grep -q "operational_activities" src/integrations/supabase/types.ts; then
        echo "✅ operational_activities trouvée"
    else
        echo "❌ operational_activities NON trouvée"
    fi
    
    if grep -q "operational_schedules" src/integrations/supabase/types.ts; then
        echo "✅ operational_schedules trouvée"
    else
        echo "❌ operational_schedules NON trouvée"
    fi
    
    if grep -q "operational_action_templates" src/integrations/supabase/types.ts; then
        echo "✅ operational_action_templates trouvée"
    else
        echo "❌ operational_action_templates NON trouvée"
    fi
    
    echo ""
    echo "🔍 Vérification des nouvelles RPC functions..."
    
    if grep -q "instantiate_one_off_activity" src/integrations/supabase/types.ts; then
        echo "✅ instantiate_one_off_activity trouvée"
    else
        echo "❌ instantiate_one_off_activity NON trouvée"
    fi
    
    if grep -q "clone_operational_actions_to_task" src/integrations/supabase/types.ts; then
        echo "✅ clone_operational_actions_to_task trouvée"
    else
        echo "❌ clone_operational_actions_to_task NON trouvée"
    fi
    
    echo ""
    echo "📋 Prochaines étapes:"
    echo "   1. Les erreurs TypeScript devraient disparaître"
    echo "   2. Redémarrer le serveur de dev: npm run dev"
    echo "   3. Tester le module /operations"
    echo ""
else
    echo ""
    echo "❌ ÉCHEC DE LA GÉNÉRATION"
    exit 1
fi
