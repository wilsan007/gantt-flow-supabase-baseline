#!/bin/bash

# =====================================================
# Script de Déploiement de l'Edge Function
# operational-instantiator
# =====================================================

set -e  # Arrêter en cas d'erreur

echo "═══════════════════════════════════════════════════"
echo "🚀 DÉPLOIEMENT DE L'EDGE FUNCTION"
echo "═══════════════════════════════════════════════════"

# Vérifier que Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI n'est pas installé"
    echo "📦 Installation: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI trouvé"

# Vérifier la connexion au projet
echo ""
echo "🔍 Vérification de la connexion au projet..."
supabase status 2>/dev/null || {
    echo "⚠️  Pas encore lié à un projet Supabase"
    echo "🔗 Lien: supabase link --project-ref qliinxtanjdnwxlvnxji"
    read -p "Voulez-vous le faire maintenant? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        supabase link --project-ref qliinxtanjdnwxlvnxji
    else
        exit 1
    fi
}

# Déployer la fonction
echo ""
echo "📦 Déploiement de operational-instantiator..."
supabase functions deploy operational-instantiator

# Vérifier le déploiement
if [ $? -eq 0 ]; then
    echo ""
    echo "═══════════════════════════════════════════════════"
    echo "✅ DÉPLOIEMENT RÉUSSI"
    echo "═══════════════════════════════════════════════════"
    echo ""
    echo "📍 URL de la fonction:"
    echo "   https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/operational-instantiator"
    echo ""
    echo "🧪 Tester la fonction:"
    echo "   npm run test:edge-function"
    echo ""
    echo "📅 Configurer le cron (à faire manuellement):"
    echo "   1. Aller dans Supabase Dashboard"
    echo "   2. Database > Cron Jobs"
    echo "   3. Créer un job quotidien à 00:00 UTC"
    echo ""
else
    echo ""
    echo "❌ ÉCHEC DU DÉPLOIEMENT"
    exit 1
fi
