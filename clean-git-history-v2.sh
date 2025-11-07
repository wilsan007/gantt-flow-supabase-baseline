#!/bin/bash
# Script de nettoyage de l'historique Git pour supprimer les fichiers sensibles
# À exécuter UNIQUEMENT si vous avez coordonné avec toute l'équipe

set -e

echo "🔒 NETTOYAGE DE L'HISTORIQUE GIT"
echo "================================"
echo ""
echo "⚠️  ATTENTION: Cette opération modifie l'historique Git!"
echo "⚠️  Assurez-vous que tous les membres de l'équipe sont informés."
echo ""
read -p "Voulez-vous continuer? (oui/non): " confirm

if [ "$confirm" != "oui" ]; then
    echo "❌ Opération annulée."
    exit 0
fi

# Créer un backup
echo ""
echo "📦 Création d'un backup..."
BACKUP_DIR="../gantt-flow-backup-$(date +%Y%m%d-%H%M%S)"
cp -r . "$BACKUP_DIR"
echo "✅ Backup créé: $BACKUP_DIR"

# Télécharger BFG si nécessaire
if [ ! -f "bfg.jar" ]; then
    echo ""
    echo "📥 Téléchargement de BFG Repo-Cleaner..."
    curl -L -o bfg.jar https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar
    echo "✅ BFG téléchargé"
fi

# Vérifier Java
if ! command -v java &> /dev/null; then
    echo "❌ Java n'est pas installé. Installation requise:"
    echo "   sudo apt install default-jre  # Linux"
    echo "   brew install java              # macOS"
    exit 1
fi

echo ""
echo "🧹 Nettoyage des fichiers sensibles de l'historique..."

# Supprimer les dossiers de build
java -jar bfg.jar --delete-folders wadashaqayn_deploy_ready --no-blob-protection .
java -jar bfg.jar --delete-folders dist --no-blob-protection .

# Supprimer les fichiers de test avec secrets
java -jar bfg.jar --delete-files 'test-*.js' --no-blob-protection .

# Supprimer les fichiers SQL de debug
java -jar bfg.jar --delete-files 'fix-*.sql' --no-blob-protection .
java -jar bfg.jar --delete-files 'check-*.sql' --no-blob-protection .
java -jar bfg.jar --delete-files 'repair-*.sql' --no-blob-protection .

echo ""
echo "🗑️  Nettoyage des références Git..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "✅ Nettoyage terminé!"
echo ""
echo "📊 Vérification de la taille du repo:"
du -sh .git

echo ""
echo "🚀 Prochaine étape:"
echo "   git push --force origin main"
echo ""
echo "⚠️  N'oubliez pas d'informer l'équipe de faire:"
echo "   git fetch origin"
echo "   git reset --hard origin/main"
