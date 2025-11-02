#!/bin/bash
# Script d'analyse automatique des doublons

echo "🔍 ANALYSE AUTOMATIQUE DES DOUBLONS"
echo "==================================="
echo ""

# Liste des fichiers dupliqués identifiés
doublons=(
  "TaskCreationDialog"
  "TaskDetailsDialog"
  "TaskEditDialog"
  "TaskSelectionDialog"
  "ResponsiveLayout"
  "ViewModeContext"
  "MobileDynamicTable"
  "MobileKanbanBoard"
  "GanttHeader"
  "GanttStates"
  "GanttTaskBar"
  "GanttTaskList"
  "GanttTimeline"
  "EnhancedTaskDetailsDialog"
  "ProjectTableView"
  "TenantContext"
  "ganttHelpers"
  "use-toast"
  "Index"
)

for doublon in "${doublons[@]}"; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📄 Analyse: $doublon"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  # Trouver tous les fichiers
  echo ""
  echo "📂 Fichiers trouvés:"
  find src -name "${doublon}*" 2>/dev/null | while read file; do
    lines=$(wc -l < "$file" 2>/dev/null || echo "0")
    echo "   $file ($lines lignes)"
  done
  
  # Trouver imports (sans les fichiers eux-mêmes)
  echo ""
  echo "📥 Imports trouvés:"
  grep -r "from.*${doublon}" src --include="*.tsx" --include="*.ts" 2>/dev/null | \
    grep -v "node_modules" | \
    grep -v "^Binary" | \
    cut -d: -f1 | \
    sort -u | \
    while read file; do
      import_line=$(grep "from.*${doublon}" "$file" | head -1)
      echo "   → $file"
      echo "     $import_line"
    done
  
  # Si aucun import
  if ! grep -r "from.*${doublon}" src --include="*.tsx" --include="*.ts" 2>/dev/null | grep -q .; then
    echo "   ⚠️  AUCUN IMPORT TROUVÉ"
  fi
  
  echo ""
done

echo ""
echo "✅ Analyse terminée"
echo ""
echo "📊 Résumé:"
echo "   - Fichiers analysés: ${#doublons[@]}"
echo "   - Voir détails ci-dessus"
