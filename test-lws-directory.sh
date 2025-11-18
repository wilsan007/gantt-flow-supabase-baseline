#!/bin/bash

# Script pour identifier le répertoire FTP correct sur LWS

echo "🔍 Test de Répertoire FTP LWS"
echo "=============================="
echo ""

# Demander les credentials
read -p "📡 Serveur FTP (ftp.wadashaqayn.com): " FTP_SERVER
FTP_SERVER=${FTP_SERVER:-ftp.wadashaqayn.com}

read -p "👤 Username (wadas2665751): " FTP_USER
FTP_USER=${FTP_USER:-wadas2665751}

read -sp "🔐 Mot de passe FTP: " FTP_PASS
echo ""
echo ""

echo "🧪 Test de connexion et listage des répertoires..."
echo ""

# Connexion FTP et listage
ftp -inv $FTP_SERVER <<EOF
user $FTP_USER $FTP_PASS
pwd
ls -la
quit
EOF

echo ""
echo "=============================="
echo "📋 Instructions:"
echo ""
echo "Dans la liste ci-dessus, cherchez un dossier comme:"
echo "  - htdocs/"
echo "  - html_public/"
echo "  - public_html/"
echo "  - www/"
echo ""
echo "C'est là que votre site web doit être déployé."
echo ""
echo "Pour GitHub Secret FTP_REMOTE_DIR, utilisez:"
echo "  /nom_du_dossier"
echo ""
echo "Exemple: /htdocs ou /html_public"
echo "=============================="
