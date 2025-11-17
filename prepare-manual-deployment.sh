#!/bin/bash

# Script de Préparation du Déploiement Manuel
# Usage: ./prepare-manual-deployment.sh

echo "🚀 Préparation du Déploiement Manuel Wadashaqayn"
echo "================================================"
echo ""

# 1. Nettoyer les anciens builds
echo "🧹 Nettoyage des anciens builds..."
rm -rf dist/
rm -f wadashaqayn-deployment.tar.gz
rm -f wadashaqayn-deployment.zip
echo "✅ Nettoyage terminé"
echo ""

# 2. Vérifier les variables d'environnement
echo "🔍 Vérification des variables d'environnement..."
if [ ! -f ".env" ]; then
    echo "⚠️  ATTENTION: Fichier .env non trouvé!"
    echo "   Le build utilisera les variables par défaut (localhost)"
    echo ""
    read -p "Continuer quand même ? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Déploiement annulé"
        exit 1
    fi
else
    echo "✅ Fichier .env trouvé"
    echo ""
    echo "📋 Variables Supabase détectées:"
    grep "VITE_SUPABASE" .env | sed 's/=.*/=***/' || echo "   ⚠️  Aucune variable Supabase trouvée"
    echo ""
fi

# 3. Build de l'application
echo "🔨 Build de l'application..."
echo ""
npm run build

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Erreur lors du build!"
    exit 1
fi

echo ""
echo "✅ Build réussi!"
echo ""

# 4. Vérifier le contenu du build
echo "📊 Contenu du build:"
ls -lh dist/ | head -n 10
echo "..."
echo ""
echo "📏 Taille totale: $(du -sh dist | cut -f1)"
echo ""

# 5. Créer l'archive TAR.GZ
echo "📦 Création de l'archive .tar.gz..."
cd dist
tar -czf ../wadashaqayn-deployment.tar.gz .
cd ..
echo "✅ Archive créée: wadashaqayn-deployment.tar.gz ($(du -h wadashaqayn-deployment.tar.gz | cut -f1))"
echo ""

# 6. Créer l'archive ZIP (optionnel)
echo "📦 Création de l'archive .zip..."
cd dist
zip -r -q ../wadashaqayn-deployment.zip .
cd ..
echo "✅ Archive créée: wadashaqayn-deployment.zip ($(du -h wadashaqayn-deployment.zip | cut -f1))"
echo ""

# 7. Résumé
echo "=========================================="
echo "✅ Déploiement Manuel Prêt!"
echo "=========================================="
echo ""
echo "📁 Fichiers disponibles:"
echo "   1. Dossier:  dist/ ($(du -sh dist | cut -f1))"
echo "   2. Archive:  wadashaqayn-deployment.tar.gz ($(du -h wadashaqayn-deployment.tar.gz | cut -f1))"
echo "   3. Archive:  wadashaqayn-deployment.zip ($(du -h wadashaqayn-deployment.zip | cut -f1))"
echo ""
echo "📖 Guide de déploiement:"
echo "   Consultez: DEPLOIEMENT_MANUEL_HOSTINGER.md"
echo ""
echo "🎯 Options de Déploiement:"
echo ""
echo "   OPTION 1 (Recommandé): Archive .tar.gz"
echo "   ----------------------------------------"
echo "   1. Connectez-vous à Hostinger"
echo "   2. Gestionnaire de fichiers → public_html"
echo "   3. Supprimez tous les anciens fichiers"
echo "   4. Uploadez: wadashaqayn-deployment.tar.gz"
echo "   5. Extrayez l'archive"
echo ""
echo "   OPTION 2: Archive .zip"
echo "   ----------------------------------------"
echo "   1. Connectez-vous à Hostinger"
echo "   2. Gestionnaire de fichiers → public_html"
echo "   3. Supprimez tous les anciens fichiers"
echo "   4. Uploadez: wadashaqayn-deployment.zip"
echo "   5. Extrayez l'archive"
echo ""
echo "   OPTION 3: Via FTP (FileZilla)"
echo "   ----------------------------------------"
echo "   Serveur: 45.84.205.125"
echo "   User:    u643283251"
echo "   Port:    21"
echo "   → Uploadez le contenu de dist/ vers /public_html/"
echo ""
echo "🚀 Bon déploiement!"
echo ""
