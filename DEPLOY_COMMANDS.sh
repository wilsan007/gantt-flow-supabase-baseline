#!/bin/bash

# 🚀 Script de Déploiement sur Hostinger via GitHub
# Ce script prépare et pousse le code sur GitHub pour déclenchement automatique

echo "🚀 Préparation du déploiement sur Hostinger"
echo "=============================================="

# 1. Vérifier que nous sommes sur la branche main
echo ""
echo "📍 Vérification de la branche..."
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "⚠️  Vous êtes sur la branche: $CURRENT_BRANCH"
    read -p "Voulez-vous changer vers main? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout main
    else
        echo "❌ Déploiement annulé"
        exit 1
    fi
fi

# 2. Vérifier les modifications
echo ""
echo "📝 Vérification des modifications..."
if [[ -n $(git status -s) ]]; then
    echo "✅ Modifications détectées:"
    git status -s
    
    # 3. Ajouter tous les fichiers
    echo ""
    read -p "📦 Voulez-vous ajouter tous les fichiers? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        echo "✅ Fichiers ajoutés"
    fi
    
    # 4. Commit
    echo ""
    read -p "💬 Message du commit: " COMMIT_MSG
    if [ -z "$COMMIT_MSG" ]; then
        COMMIT_MSG="deploy: mise à jour application"
    fi
    git commit -m "$COMMIT_MSG"
    echo "✅ Commit créé"
else
    echo "ℹ️  Aucune modification à commiter"
fi

# 5. Pull avant push
echo ""
echo "📥 Récupération des dernières modifications..."
git pull origin main
if [ $? -ne 0 ]; then
    echo "⚠️  Conflit détecté. Résolvez les conflits manuellement puis relancez."
    exit 1
fi

# 6. Push vers GitHub
echo ""
echo "📤 Push vers GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "=============================================="
    echo "✅ Code poussé sur GitHub avec succès!"
    echo ""
    echo "🔄 Le déploiement automatique va se lancer..."
    echo ""
    echo "📊 Suivez le déploiement sur:"
    echo "   https://github.com/VOTRE_USERNAME/VOTRE_REPO/actions"
    echo ""
    echo "⏱️  Temps estimé: 2-3 minutes"
    echo "=============================================="
else
    echo "❌ Erreur lors du push"
    exit 1
fi
