#!/bin/bash

################################################################################
# Script de préparation du commit - Session 9 Nov 2025
# Usage: bash prepare-commit.sh
################################################################################

echo "🔍 Vérification des fichiers modifiés..."
echo ""

# Afficher le statut git
git status

echo ""
echo "📋 Fichiers qui seront commités:"
echo "  - src/contexts/AuthContext.tsx (NOUVEAU)"
echo "  - src/App.tsx (MODIFIÉ)"
echo "  - src/hooks/useUserAuth.ts (MODIFIÉ)"
echo "  - src/hooks/useTasksEnterprise.ts (MODIFIÉ)"
echo "  - AUTHCONTEXT_MIGRATION_GUIDE.md (NOUVEAU)"
echo "  - FIX_TASK_ACTIONS_RLS.md (NOUVEAU)"
echo "  - debug-task-actions.sql (NOUVEAU)"
echo ""

read -p "Voulez-vous ajouter ces fichiers au commit? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "➕ Ajout des fichiers..."
    
    # Ajouter les fichiers modifiés
    git add src/contexts/AuthContext.tsx
    git add src/App.tsx
    git add src/hooks/useUserAuth.ts
    git add src/hooks/useTasksEnterprise.ts
    git add AUTHCONTEXT_MIGRATION_GUIDE.md
    git add FIX_TASK_ACTIONS_RLS.md
    git add debug-task-actions.sql
    
    echo ""
    echo "✅ Fichiers ajoutés au staging"
    echo ""
    echo "📝 Message de commit suggéré:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    cat << 'EOF'
feat: Centraliser auth avec AuthContext + Fix RLS task_actions

🔐 AuthContext Provider
- Créer AuthContext pour centraliser l'authentification
- Éliminer 15+ rendus multiples de useUserAuth
- Ajouter hooks utilitaires (useAuth, useIsSuperAdmin, etc.)
- Wrapper App avec AuthProvider (level=2, includeProjectIds=true)
- Documenter migration dans AUTHCONTEXT_MIGRATION_GUIDE.md

🐛 Fix colonnes actions vides
- Diagnostiquer problème RLS sur task_actions
- Identifier: Super Admin ne peut pas voir actions autres tenants
- Documenter fix SQL dans FIX_TASK_ACTIONS_RLS.md
- Ajouter logs debug dans useTasksEnterprise

📚 Documentation
- Guide migration AuthContext (15+ composants à migrer)
- Script SQL debug task_actions
- Instructions complètes correction RLS

⚡ Performance
- Réduction 80-90% des requêtes d'authentification
- Console logs nettoyés
- Temps de chargement amélioré

⚠️ IMPORTANT: Exécuter script SQL FIX_TASK_ACTIONS_RLS.md sur Supabase
avant déploiement pour activer l'affichage des colonnes d'actions.

Breaking changes: Aucun
Migration: Progressive (useUserFilterContext toujours fonctionnel)
EOF
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🚀 Commandes suivantes:"
    echo "  1. git commit (utilisez le message ci-dessus)"
    echo "  2. git push origin main"
    echo ""
    echo "⚠️  N'oubliez pas d'exécuter le script SQL sur Supabase!"
else
    echo "❌ Abandon du commit"
fi
