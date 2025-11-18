#!/bin/bash

# Script pour trouver automatiquement le bon répertoire FTP
# Usage: ./find-ftp-directory.sh [mot_de_passe_ftp]

FTP_SERVER="ftp.wadashaqayn.com"
FTP_USER="wadas2665751"
FTP_PASS="$1"

if [ -z "$FTP_PASS" ]; then
    echo "❌ Usage: ./find-ftp-directory.sh '4W$Q2f6uzNh'"
    echo ""
    echo "Exemple:"
    echo "  ./find-ftp-directory.sh '4W$Q2f6uzNh'"
    exit 1
fi

echo "🔍 Recherche du Répertoire FTP sur LWS"
echo "========================================"
echo "📡 Serveur: $FTP_SERVER"
echo "👤 Username: $FTP_USER"
echo ""

# Test de connexion
echo "1️⃣  Test de connexion..."
curl -s --user "$FTP_USER:$FTP_PASS" "ftp://$FTP_SERVER/" > /tmp/ftp_list.txt 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Connexion réussie!"
    echo ""
    echo "📁 Répertoires disponibles:"
    echo "----------------------------"
    cat /tmp/ftp_list.txt
    echo "----------------------------"
    echo ""
    
    # Analyser les résultats
    echo "🔍 Analyse des répertoires..."
    echo ""
    
    DIRS=()
    
    if grep -q "htdocs" /tmp/ftp_list.txt; then
        echo "✅ Trouvé: htdocs/"
        DIRS+=("/htdocs")
    fi
    
    if grep -q "html_public" /tmp/ftp_list.txt; then
        echo "✅ Trouvé: html_public/"
        DIRS+=("/html_public")
    fi
    
    if grep -q "public_html" /tmp/ftp_list.txt; then
        echo "✅ Trouvé: public_html/"
        DIRS+=("/public_html")
    fi
    
    if grep -q "www" /tmp/ftp_list.txt; then
        echo "✅ Trouvé: www/"
        DIRS+=("/www")
    fi
    
    echo ""
    echo "========================================"
    echo "📝 RECOMMANDATION"
    echo "========================================"
    
    if [ ${#DIRS[@]} -gt 0 ]; then
        echo ""
        echo "Utilisez l'un de ces répertoires pour FTP_REMOTE_DIR:"
        for dir in "${DIRS[@]}"; do
            echo "  → $dir"
        done
        echo ""
        echo "⭐ Recommandé: ${DIRS[0]}"
        echo ""
        echo "Configurez dans GitHub Secrets:"
        echo "  FTP_REMOTE_DIR = ${DIRS[0]}"
    else
        echo ""
        echo "Aucun répertoire web standard détecté."
        echo "Vérifiez manuellement avec FileZilla."
        echo ""
        echo "Liste complète disponible dans: /tmp/ftp_list.txt"
    fi
    
    echo ""
    echo "========================================"
    
    rm /tmp/ftp_list.txt
else
    echo "❌ Connexion échouée!"
    echo ""
    echo "Vérifiez:"
    echo "  - Le mot de passe est correct"
    echo "  - Le serveur FTP est accessible"
    echo ""
    echo "Détails de l'erreur:"
    cat /tmp/ftp_list.txt
    rm /tmp/ftp_list.txt
    exit 1
fi
