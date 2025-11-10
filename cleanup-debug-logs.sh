#!/bin/bash

################################################################################
# Script optionnel: Nettoyer les logs de debug avant commit final
# Usage: bash cleanup-debug-logs.sh
################################################################################

echo "🧹 Nettoyage des logs de debug..."
echo ""
echo "⚠️  Ce script va RETIRER les console.log de debug ajoutés dans:"
echo "   - src/hooks/useTasksEnterprise.ts"
echo ""
echo "Ces logs sont utiles pour le développement mais peuvent être"
echo "retirés avant le commit en production."
echo ""

read -p "Voulez-vous nettoyer les logs maintenant? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "🔧 Suppression des logs dans useTasksEnterprise.ts..."
    
    # Créer une sauvegarde
    cp src/hooks/useTasksEnterprise.ts src/hooks/useTasksEnterprise.ts.backup
    
    # Retirer les blocs de debug (lignes 263-269 et 279-290)
    # Note: Ceci est une approche simple, à adapter selon vos besoins
    
    echo ""
    echo "⚠️  ATTENTION: Ce script doit être adapté manuellement."
    echo "   Les numéros de ligne peuvent avoir changé."
    echo ""
    echo "✅ Sauvegarde créée: src/hooks/useTasksEnterprise.ts.backup"
    echo ""
    echo "📝 Pour retirer les logs manuellement:"
    echo "   1. Ouvrir src/hooks/useTasksEnterprise.ts"
    echo "   2. Commenter ou supprimer les console.log ajoutés"
    echo "   3. Ligne ~263-269: console.log('🔄 Fetching tasks data...')"
    echo "   4. Ligne ~279-290: console.log('🔍 DEBUG useTasksEnterprise...')"
    echo ""
    echo "Ou les garder pour le moment et nettoyer plus tard!"
    
else
    echo "❌ Nettoyage annulé"
    echo ""
    echo "💡 Vous pouvez garder les logs pour le développement."
    echo "   Ils seront utiles pour diagnostiquer d'autres problèmes."
fi

echo ""
echo "✅ Script terminé"
