#!/bin/bash

# Script pour déployer l'Edge Function de gestion de confirmation d'email
# Assurez-vous d'avoir Supabase CLI installé et configuré

echo "🚀 Déploiement de l'Edge Function handle-email-confirmation"
echo "=========================================================="

# Vérifier si Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI n'est pas installé"
    echo "📥 Installation avec npm: npm install -g supabase"
    exit 1
fi

# Vérifier si on est dans un projet Supabase
if [ ! -f "supabase/config.toml" ]; then
    echo "⚠️  Pas de configuration Supabase trouvée"
    echo "🔧 Initialisation du projet Supabase..."
    supabase init
fi

# Créer le dossier de l'Edge Function s'il n'existe pas
mkdir -p supabase/functions/handle-email-confirmation

# Vérifier que le fichier index.ts existe
if [ ! -f "supabase/functions/handle-email-confirmation/index.ts" ]; then
    echo "❌ Fichier index.ts non trouvé dans supabase/functions/handle-email-confirmation/"
    echo "📝 Assurez-vous que le fichier a été créé correctement"
    exit 1
fi

echo "✅ Fichier Edge Function trouvé"

# Se connecter à Supabase (si pas déjà fait)
echo "🔐 Connexion à Supabase..."
supabase login

# Lier le projet (remplacez par votre project-id)
echo "🔗 Liaison du projet..."
supabase link --project-ref qliinxtanjdnwxlvnxji

# Déployer l'Edge Function
echo "📦 Déploiement de l'Edge Function..."
supabase functions deploy handle-email-confirmation --no-verify-jwt

if [ $? -eq 0 ]; then
    echo "✅ Edge Function déployée avec succès!"
    echo ""
    echo "📋 Prochaines étapes:"
    echo "1. Exécuter setup-email-confirmation-webhook.sql dans Supabase Dashboard"
    echo "2. Configurer le webhook dans Database > Webhooks:"
    echo "   - Table: auth.users"
    echo "   - Events: UPDATE"
    echo "   - Conditions: email_confirmed_at IS NOT NULL"
    echo "   - URL: https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation"
    echo ""
    echo "🧪 Pour tester:"
    echo "   SELECT force_create_tenant_owner('email@example.com');"
else
    echo "❌ Erreur lors du déploiement"
    exit 1
fi
