#!/bin/bash

echo "🔍 TEST DE CONNEXION FTP HOSTINGER"
echo "=================================="
echo ""

# Configuration
FTP_SERVER="45.84.205.125"
FTP_USER="u64328325I"
FTP_PORT="21"

echo "📋 Configuration:"
echo "   Serveur: $FTP_SERVER"
echo "   Port: $FTP_PORT"
echo "   Username: $FTP_USER"
echo ""

# Test 1: Ping du serveur
echo "1️⃣ Test de connectivité réseau..."
if ping -c 1 -W 2 $FTP_SERVER &> /dev/null; then
    echo "   ✅ Serveur accessible"
else
    echo "   ❌ Serveur non accessible"
fi
echo ""

# Test 2: Port FTP ouvert
echo "2️⃣ Test du port FTP 21..."
if timeout 5 bash -c "cat < /dev/null > /dev/tcp/$FTP_SERVER/21" 2>/dev/null; then
    echo "   ✅ Port 21 ouvert"
else
    echo "   ❌ Port 21 fermé ou inaccessible"
fi
echo ""

# Test 3: Connexion FTP avec curl
echo "3️⃣ Test de connexion FTP avec curl..."
echo "   Entrez le mot de passe FTP:"
read -s FTP_PASS
echo ""

curl -v --connect-timeout 10 \
  ftp://$FTP_SERVER:$FTP_PORT \
  --user "$FTP_USER:$FTP_PASS" \
  2>&1 | grep -E "(Connected|Login|530|220|331|230)"

echo ""
echo "=================================="
echo "Test terminé!"
