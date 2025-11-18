#!/bin/bash

# Script automatisé pour vérifier le répertoire FTP LWS

echo "🔍 Vérification Répertoire FTP LWS"
echo "===================================="
echo ""

FTP_SERVER="ftp.wadashaqayn.com"
FTP_USER="wadas2665751"

echo "📡 Serveur: $FTP_SERVER"
echo "👤 Username: $FTP_USER"
echo ""
read -sp "🔐 Entrez votre mot de passe FTP: " FTP_PASS
echo ""
echo ""

echo "🧪 Connexion et listage des répertoires..."
echo ""

# Test de connexion et listage
ftp -inv $FTP_SERVER <<EOF 2>&1
user $FTP_USER $FTP_PASS
pwd
ls -la
bye
EOF

echo ""
echo "===================================="
echo "📋 ANALYSE DES RÉSULTATS"
echo "===================================="
echo ""
echo "Cherchez dans la liste ci-dessus un dossier comme:"
echo "  ✅ htdocs/           → Utilisez: /htdocs"
echo "  ✅ html_public/      → Utilisez: /html_public"
echo "  ✅ public_html/      → Utilisez: /public_html"
echo "  ✅ www/              → Utilisez: /www"
echo ""
echo "Si vous voyez plusieurs dossiers, choisissez celui"
echo "qui contient (ou devrait contenir) votre site web."
echo ""
echo "===================================="
echo "📝 CONFIGURATION GITHUB SECRET"
echo "===================================="
echo ""
echo "1. Allez sur:"
echo "   https://github.com/wilsan007/gantt-flow-supabase-baseline/settings/secrets/actions"
echo ""
echo "2. Cherchez ou créez: FTP_REMOTE_DIR"
echo ""
echo "3. Valeur: /nom_du_dossier (ex: /htdocs)"
echo ""
echo "===================================="
