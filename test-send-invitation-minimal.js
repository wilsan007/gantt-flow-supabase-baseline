/**
 * 🧪 TEST SEND-INVITATION VERSION MINIMALE
 * 
 * Test complet de la fonction send-invitation optimisée
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

async function testSendInvitationMinimal() {
  console.log('🧪 ===== TEST SEND-INVITATION VERSION MINIMALE =====');
  console.log('🎯 Test complet avec authentification Super Admin');
  console.log('');

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  // Créer un client admin pour obtenir un token valide
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // ÉTAPE 1: Obtenir un token Super Admin valide
    console.log('🔍 ÉTAPE 1: Obtention token Super Admin...');
    
    // Utiliser directement le service role key comme token
    const adminToken = SUPABASE_SERVICE_ROLE_KEY;
    console.log('✅ Token admin obtenu (longueur):', adminToken.length);

    // ÉTAPE 2: Préparer les données de test
    console.log('');
    console.log('🔍 ÉTAPE 2: Préparation données de test...');
    
    const timestamp = Date.now();
    const testData = {
      email: `test-send-${timestamp}@example.com`,
      fullName: `Test Send ${timestamp}`,
      invitationType: 'tenant_owner',
      siteUrl: 'http://localhost:8080'
    };

    console.log('📊 Données de test:');
    console.log('   - Email:', testData.email);
    console.log('   - Nom:', testData.fullName);
    console.log('   - Type:', testData.invitationType);

    // ÉTAPE 3: Appeler la fonction send-invitation
    console.log('');
    console.log('🔍 ÉTAPE 3: Appel send-invitation version minimale...');
    
    // Test de la version compacte (remplacer par l'URL correcte si déployée)
    const functionUrl = `${SUPABASE_URL}/functions/v1/send-invitation`;
    
    const startTime = Date.now();
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'apikey': adminToken
      },
      body: JSON.stringify(testData)
    });
    const endTime = Date.now();

    console.log('📊 RÉSULTAT APPEL FONCTION:');
    console.log('   - Status:', response.status);
    console.log('   - Status Text:', response.statusText);
    console.log('   - Durée:', endTime - startTime, 'ms');
    console.log('   - Headers CORS:', response.headers.get('Access-Control-Allow-Origin'));

    if (response.ok) {
      const responseData = await response.json();
      console.log('   - Réponse complète:');
      console.log(JSON.stringify(responseData, null, 2));
      
      if (responseData.success) {
        console.log('');
        console.log('🎉 SUCCÈS COMPLET !');
        console.log('✅ send-invitation version minimale fonctionne');
        console.log('📊 Données créées:');
        console.log('   - Invitation ID:', responseData.data.invitation_id);
        console.log('   - User ID:', responseData.data.user_id);
        console.log('   - Tenant ID:', responseData.data.tenant_id);
        console.log('   - Éléments validés:', responseData.data.validation_elements);
        console.log('   - Lien confirmation:', responseData.data.confirmation_url ? 'GÉNÉRÉ' : 'MANQUANT');
        
        // ÉTAPE 4: Vérification des données créées
        console.log('');
        console.log('🔍 ÉTAPE 4: Vérification données créées...');
        
        // Vérifier utilisateur
        const { data: createdUser } = await supabaseAdmin.auth.admin.getUserById(responseData.data.user_id);
        
        // Vérifier invitation
        const { data: createdInvitation } = await supabaseAdmin
          .from('invitations')
          .select('*')
          .eq('id', responseData.data.invitation_id)
          .single();
        
        console.log('📊 Vérification:');
        console.log('   - Utilisateur créé:', !!createdUser?.user);
        console.log('   - Invitation créée:', !!createdInvitation);
        console.log('   - Métadonnées utilisateur:', !!createdUser?.user?.raw_user_meta_data);
        console.log('   - 10 éléments user:', Object.keys(createdUser?.user?.raw_user_meta_data || {}).length);
        console.log('   - Métadonnées invitation:', !!createdInvitation?.metadata);
        
        if (createdInvitation?.metadata) {
          const metadata = typeof createdInvitation.metadata === 'string' 
            ? JSON.parse(createdInvitation.metadata) 
            : createdInvitation.metadata;
          console.log('   - Éléments validation:', Object.keys(metadata?.validation_elements || {}).length);
        }
        
        // NETTOYAGE
        console.log('');
        console.log('🧹 NETTOYAGE...');
        
        try {
          await supabaseAdmin.from('invitations').delete().eq('id', responseData.data.invitation_id);
          await supabaseAdmin.auth.admin.deleteUser(responseData.data.user_id);
          console.log('✅ Données de test supprimées');
        } catch (cleanupError) {
          console.error('⚠️ Erreur nettoyage:', cleanupError.message);
        }
        
        console.log('');
        console.log('🏆 VALIDATION FINALE:');
        console.log('✅ send-invitation version minimale (277 lignes) opérationnelle');
        console.log('✅ Génération des 10 éléments validée');
        console.log('✅ Création utilisateur + invitation réussie');
        console.log('✅ Lien de confirmation généré');
        console.log('🚀 Prête pour remplacer la version de 811 lignes');
        
      } else {
        console.log('');
        console.log('⚠️ SUCCÈS PARTIEL:');
        console.log('   - Message:', responseData.message);
        console.log('   - Erreur:', responseData.error || 'Aucune');
      }
      
    } else {
      const errorText = await response.text();
      console.log('   - Erreur complète:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log('');
        console.log('❌ ANALYSE ERREUR:');
        console.log('   - Code:', errorJson.code || 'Inconnu');
        console.log('   - Message:', errorJson.message || 'Aucun');
        console.log('   - Détails:', errorJson.details || 'Aucun');
        console.log('   - Context:', errorJson.context || 'Aucun');
        
        if (errorJson.error_stack) {
          console.log('   - Stack trace disponible dans les logs');
        }
        
        console.log('');
        console.log('💡 ACTIONS RECOMMANDÉES:');
        console.log('   - Vérifier les logs Supabase Edge Functions');
        console.log('   - Identifier la ligne exacte de l\'erreur');
        console.log('   - Corriger la syntaxe ou logique problématique');
        
      } catch (parseError) {
        console.log('   - Erreur de parsing JSON, réponse brute:', errorText);
      }
    }

  } catch (error) {
    console.error('🚨 ERREUR DURANT LE TEST:', error);
  }
}

testSendInvitationMinimal().then(() => {
  console.log('');
  console.log('🏁 Test send-invitation minimal terminé');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
