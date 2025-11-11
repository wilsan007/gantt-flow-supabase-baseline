#!/bin/bash

# Script d'optimisation - Tree-shaking Lucide Icons
# Remplace les imports groupés par des imports individuels

echo "🔍 Analyse des imports lucide-react..."

# Compter imports avant
BEFORE=$(grep -r "from 'lucide-react'" src/ | wc -l)
echo "📦 Imports trouvés: $BEFORE"

# Créer backup
echo "💾 Création backup..."
cp -r src src-backup-$(date +%Y%m%d-%H%M%S)

echo "⚡ Optimisation en cours..."

# Note: Cette approche simple ne fonctionne pas bien avec les imports multi-lignes
# Une meilleure solution est de le faire manuellement sur les fichiers principaux

echo "⚠️  Optimisation manuelle recommandée pour les fichiers suivants:"
echo ""
grep -r "from 'lucide-react'" src/ --include="*.tsx" --include="*.ts" | cut -d: -f1 | sort | uniq | head -20

echo ""
echo "✅ Script terminé. Optimisation manuelle nécessaire."
echo ""
echo "📝 Pour optimiser manuellement:"
echo "   1. Identifier les fichiers avec le plus d'imports"
echo "   2. Remplacer imports groupés par imports individuels"
echo "   3. Exemple:"
echo "      AVANT: import { Calendar, User } from 'lucide-react'"
echo "      APRÈS: import Calendar from 'lucide-react/dist/esm/icons/calendar'"
echo "             import User from 'lucide-react/dist/esm/icons/user'"
