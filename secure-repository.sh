#!/bin/bash

# Script de Sécurisation du Repository
# Nettoie l'historique Git et sécurise les secrets

echo "🔒 Sécurisation du Repository Wadashaqeen"
echo "========================================="
echo ""

# Confirmation
echo "⚠️  ATTENTION: Ce script va :"
echo "   1. Vérifier la présence de .env dans l'historique Git"
echo "   2. Proposer de nettoyer l'historique (DANGEREUX - réécrit l'histoire)"
echo "   3. Vérifier la configuration de sécurité"
echo ""
read -p "Continuer ? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Annulé"
    exit 1
fi

# 1. Vérifier .env dans .gitignore
echo ""
echo "1️⃣  Vérification .gitignore..."
if grep -q "^\.env$" .gitignore; then
    echo "✅ .env est dans .gitignore"
else
    echo "❌ .env n'est PAS dans .gitignore!"
    echo "Ajout de .env dans .gitignore..."
    echo ".env" >> .gitignore
    echo "✅ Ajouté"
fi

# 2. Vérifier .env dans le working directory
echo ""
echo "2️⃣  Vérification du working directory..."
if [ -f ".env" ]; then
    echo "⚠️  Fichier .env détecté"
    
    # Vérifier s'il contient des secrets dangereux
    if grep -q "SERVICE_ROLE_KEY" .env 2>/dev/null; then
        echo "❌ DANGER: .env contient SERVICE_ROLE_KEY!"
        echo "   Cette clé NE DOIT PAS être dans .env local!"
        echo "   Elle doit être dans: Supabase Dashboard → Edge Functions → Secrets"
    fi
    
    if grep -q "RESEND_API_KEY" .env 2>/dev/null; then
        echo "❌ DANGER: .env contient RESEND_API_KEY!"
        echo "   Cette clé NE DOIT PAS être dans .env local!"
    fi
    
    echo "✅ .env existe localement (normal pour le développement)"
else
    echo "ℹ️  Aucun fichier .env trouvé (créez-le depuis .env.example)"
fi

# 3. Vérifier .env dans l'index Git
echo ""
echo "3️⃣  Vérification de l'index Git..."
if git ls-files | grep -q "^\.env$"; then
    echo "❌ .env est dans l'index Git!"
    echo "Suppression de .env de l'index..."
    git rm --cached .env
    echo "✅ Supprimé de l'index (pas du disque)"
else
    echo "✅ .env n'est pas dans l'index Git"
fi

# 4. Vérifier l'historique Git
echo ""
echo "4️⃣  Vérification de l'historique Git..."
HISTORY_COUNT=$(git log --all --full-history --oneline -- .env 2>/dev/null | wc -l)

if [ $HISTORY_COUNT -gt 0 ]; then
    echo "❌ .env trouvé dans $HISTORY_COUNT commit(s) de l'historique!"
    echo ""
    echo "Commits concernés:"
    git log --all --full-history --oneline -- .env | head -10
    echo ""
    echo "🚨 RISQUE DE SÉCURITÉ CRITIQUE!"
    echo "   Des secrets peuvent être exposés dans l'historique Git public."
    echo ""
    read -p "Voulez-vous nettoyer l'historique ? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "⚠️  ATTENTION: Cette opération va :"
        echo "   - Réécrire l'historique Git"
        echo "   - Nécessiter un force push"
        echo "   - Potentiellement causer des conflits si d'autres travaillent sur le repo"
        echo ""
        read -p "Êtes-vous absolument sûr ? (yes/no): " CONFIRM
        
        if [ "$CONFIRM" = "yes" ]; then
            echo ""
            echo "🧹 Nettoyage de l'historique..."
            
            # Backup
            echo "📦 Création d'un backup..."
            BACKUP_DIR="../gantt-flow-next-backup-$(date +%Y%m%d-%H%M%S)"
            cp -r ../gantt-flow-next "$BACKUP_DIR"
            echo "✅ Backup créé: $BACKUP_DIR"
            
            # Nettoyer avec git filter-branch
            echo "🧹 Suppression de .env de l'historique..."
            git filter-branch --force --index-filter \
              "git rm --cached --ignore-unmatch .env" \
              --prune-empty --tag-name-filter cat -- --all
            
            # Nettoyer les refs
            echo "🧹 Nettoyage des références..."
            rm -rf .git/refs/original/
            git reflog expire --expire=now --all
            git gc --prune=now --aggressive
            
            echo ""
            echo "✅ Historique nettoyé!"
            echo ""
            echo "⚠️  PROCHAINE ÉTAPE REQUISE:"
            echo "   git push --force origin main"
            echo ""
            echo "⚠️  IMPORTANT:"
            echo "   - Prévenez tous les collaborateurs"
            echo "   - Ils devront cloner à nouveau le repo"
            echo "   - Backup disponible dans: $BACKUP_DIR"
        else
            echo "❌ Nettoyage annulé"
        fi
    else
        echo "ℹ️  Nettoyage ignoré"
        echo ""
        echo "📋 Alternatives:"
        echo "   1. Utiliser BFG Repo-Cleaner (plus rapide)"
        echo "   2. Créer un nouveau repo sans historique"
        echo "   3. Consulter SECURITY_GUIDE.md"
    fi
else
    echo "✅ .env n'est pas dans l'historique Git"
fi

# 5. Vérifier les secrets dans le code
echo ""
echo "5️⃣  Scan de secrets dans le code..."
echo "Recherche de patterns de clés API..."

# Rechercher des patterns de secrets
FOUND_SECRETS=0

if grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" . --exclude-dir={node_modules,dist,.git} --exclude="*.md" 2>/dev/null | grep -v "SECURITY_GUIDE" | grep -v "secure-repository"; then
    echo "❌ Clé JWT Supabase trouvée dans le code!"
    FOUND_SECRETS=1
fi

if grep -r "re_[A-Za-z0-9_-]\{20,\}" . --exclude-dir={node_modules,dist,.git} --exclude="*.md" 2>/dev/null | grep -v "SECURITY_GUIDE" | grep -v "secure-repository"; then
    echo "❌ Clé Resend API trouvée dans le code!"
    FOUND_SECRETS=1
fi

if [ $FOUND_SECRETS -eq 0 ]; then
    echo "✅ Aucun secret détecté dans le code source"
fi

# Résumé
echo ""
echo "========================================="
echo "📊 RÉSUMÉ DE SÉCURITÉ"
echo "========================================="
echo ""

# Checklist
echo "Checklist de Sécurité:"
echo ""

if grep -q "^\.env$" .gitignore; then
    echo "✅ .env dans .gitignore"
else
    echo "❌ .env ABSENT de .gitignore"
fi

if ! git ls-files | grep -q "^\.env$"; then
    echo "✅ .env absent de l'index Git"
else
    echo "❌ .env PRÉSENT dans l'index Git"
fi

if [ $HISTORY_COUNT -eq 0 ]; then
    echo "✅ .env absent de l'historique Git"
else
    echo "❌ .env PRÉSENT dans $HISTORY_COUNT commit(s)"
fi

if [ $FOUND_SECRETS -eq 0 ]; then
    echo "✅ Aucun secret dans le code source"
else
    echo "❌ Secrets détectés dans le code"
fi

echo ""
echo "📋 ACTIONS RECOMMANDÉES:"
echo ""
echo "1. Révoquer les clés compromises:"
echo "   - Supabase Service Role Key"
echo "   - Resend API Key"
echo ""
echo "2. Nettoyer l'historique Git (si pas encore fait)"
echo ""
echo "3. Configurer les secrets dans:"
echo "   - Supabase → Edge Functions → Secrets"
echo "   - GitHub → Settings → Secrets"
echo ""
echo "4. Lire SECURITY_GUIDE.md pour plus de détails"
echo ""

echo "✅ Audit de sécurité terminé!"
