#!/bin/bash

# Script pour déclencher manuellement le processus d'onboarding
# pour l'utilisateur wilwaalnabad@gmail.com

echo "🔧 Déclenchement manuel du processus d'onboarding..."
echo ""

# Variables
USER_ID="1bdc9ef3-c8cc-4314-9173-69b25d5a7ad0"
INVITATION_ID="171f8177-c4bd-417d-acc7-baad01d5c611"
PROJECT_REF="qliinxtanjdnwxlvnxji"

# Obtenir la Service Role Key depuis les variables d'environnement
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ ERREUR: La variable SUPABASE_SERVICE_ROLE_KEY n'est pas définie"
    echo "Veuillez l'exporter avec: export SUPABASE_SERVICE_ROLE_KEY='votre_clé'"
    exit 1
fi

echo "📤 Appel de l'Edge Function handle-email-confirmation..."
echo ""

# Construire le payload
PAYLOAD=$(cat <<EOF
{
  "type": "UPDATE",
  "table": "users",
  "schema": "auth",
  "record": {
    "id": "$USER_ID",
    "email": "wilwaalnabad@gmail.com",
    "email_confirmed_at": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")",
    "raw_user_meta_data": {
      "full_name": "wilwaal nabad",
      "invitation_type": "tenant_owner",
      "temp_user": true,
      "temp_password": "3f4k6R3M11$",
      "tenant_id": "6d1ef3c7-4ecd-4f92-915a-3bd6770e0086",
      "invitation_id": "$INVITATION_ID",
      "validation_code": "3v5v1e3c5b4v2",
      "created_timestamp": "2025-11-09T14:11:35.574Z",
      "invited_by_type": "super_admin",
      "company_name": "wilwaal Company",
      "invitation_source": "admin_panel",
      "expected_role": "tenant_admin",
      "security_level": "standard",
      "locale": "fr-FR",
      "created_by_send_invitation": true,
      "ready_for_confirmation": true,
      "validation_elements_count": 10
    }
  },
  "old_record": {
    "id": "$USER_ID",
    "email": "wilwaalnabad@gmail.com",
    "email_confirmed_at": null
  }
}
EOF
)

# Appeler l'Edge Function
RESPONSE=$(curl -s -X POST \
  "https://$PROJECT_REF.supabase.co/functions/v1/handle-email-confirmation" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -d "$PAYLOAD")

echo "📥 Réponse de l'Edge Function:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Vérifier le résultat
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ SUCCESS! Le processus d'onboarding a été déclenché avec succès!"
    echo ""
    echo "🎉 L'utilisateur wilwaalnabad@gmail.com devrait maintenant avoir:"
    echo "   - Un tenant créé"
    echo "   - Un profil créé"
    echo "   - Le rôle tenant_admin assigné"
    echo "   - Un employé créé"
    echo ""
else
    echo "❌ ERREUR lors du déclenchement du processus"
    echo "Veuillez vérifier les logs de l'Edge Function"
fi
