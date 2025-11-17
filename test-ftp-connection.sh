#!/bin/bash

# Script de test de connexion FTP LWS
# Usage: ./test-ftp-connection.sh

echo "🔌 Test de Connexion FTP LWS"
echo "============================"
echo ""

# Demander les informations FTP
read -p "📡 Serveur FTP (ex: ftp.wadashaqayn.com): " FTP_SERVER
read -p "👤 Nom d'utilisateur FTP: " FTP_USERNAME
read -sp "🔐 Mot de passe FTP: " FTP_PASSWORD
echo ""
echo ""

# Tester la connexion
echo "🧪 Test de connexion en cours..."
echo ""

ftp -inv $FTP_SERVER <<EOF
user $FTP_USERNAME $FTP_PASSWORD
ls
bye
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Connexion FTP réussie !"
    echo ""
    echo "📋 Vos identifiants à ajouter dans GitHub Secrets:"
    echo "   FTP_SERVER: $FTP_SERVER"
    echo "   FTP_USERNAME: $FTP_USERNAME"
    echo "   FTP_PASSWORD: ********"
else
    echo ""
    echo "❌ Échec de connexion FTP"
    echo ""
    echo "💡 Vérifiez:"
    echo "   1. L'adresse du serveur FTP est correcte"
    echo "   2. Le nom d'utilisateur est correct"
    echo "   3. Le mot de passe est correct"
    echo "   4. Votre compte FTP est actif sur Hostinger"
fi
