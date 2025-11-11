#!/bin/bash

# 🎨 Script de modernisation automatique des dialogs
# Convertit un dialog classique en ResponsiveDialog moderne

if [ "$#" -lt 2 ]; then
    echo "Usage: ./modernize-dialog.sh <source-file> <module-name>"
    echo "Exemple: ./modernize-dialog.sh src/components/tasks/MyDialog.tsx tasks"
    echo ""
    echo "Modules disponibles: tasks, projects, hr, operations, admin, training, analytics, settings"
    exit 1
fi

SOURCE_FILE="$1"
MODULE="$2"
BACKUP_FILE="${SOURCE_FILE}.backup"

if [ ! -f "$SOURCE_FILE" ]; then
    echo "❌ Fichier non trouvé: $SOURCE_FILE"
    exit 1
fi

echo "🎨 Modernisation de: $SOURCE_FILE"
echo "📦 Module: $MODULE"
echo ""

# Backup
cp "$SOURCE_FILE" "$BACKUP_FILE"
echo "✅ Backup créé: $BACKUP_FILE"

# Conversions de base
sed -i "s|from '@/components/ui/dialog'|from '@/components/ui/responsive-dialog'|g" "$SOURCE_FILE"
sed -i "s|<Dialog |<ResponsiveDialog module=\"$MODULE\" |g" "$SOURCE_FILE"
sed -i "s|</Dialog>|</ResponsiveDialog>|g" "$SOURCE_FILE"
sed -i "s|Dialog,|ResponsiveDialog,|g" "$SOURCE_FILE"
sed -i "s|DialogContent,|// DialogContent (géré par ResponsiveDialog),|g" "$SOURCE_FILE"
sed -i "s|DialogHeader,|// DialogHeader (géré par ResponsiveDialog),|g" "$SOURCE_FILE"
sed -i "s|DialogTitle,|// DialogTitle (géré par ResponsiveDialog),|g" "$SOURCE_FILE"
sed -i "s|DialogDescription,|// DialogDescription (géré par ResponsiveDialog),|g" "$SOURCE_FILE"
sed -i "s|DialogFooter|// DialogFooter (utiliser prop footer)|g" "$SOURCE_FILE"

echo "✅ Conversions de base effectuées"
echo ""
echo "⚠️  ACTIONS MANUELLES REQUISES:"
echo "1. Extraire title et description depuis DialogHeader"
echo "2. Créer la variable footer avec ThemedButton"
echo "3. Remplacer DialogContent par le contenu direct"
echo "4. Vérifier les imports (ajouter ThemedButton si nécessaire)"
echo "5. Tester sur mobile et desktop"
echo ""
echo "📝 Exemple de structure cible:"
echo "const footer = <ThemedButton module=\"$MODULE\">Valider</ThemedButton>;"
echo "<ResponsiveDialog module=\"$MODULE\" title=\"...\" footer={footer}>"
echo "  {/* contenu */}"
echo "</ResponsiveDialog>"

