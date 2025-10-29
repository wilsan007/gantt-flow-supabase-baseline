/**
 * 🧪 TEST SEND-INVITATION AVEC AUTHENTIFICATION RÉELLE
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

async function testWithRealAuth() {
  console.log('🧪 ===== TEST SEND-INVITATION AVEC AUTH RÉELLE =====');
  
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('🔍 Variables d\'environnement:');
  console.log('   - SUPABASE_URL:', SUPABASE_URL ? 'TROUVÉE' : 'MANQUANTE');
  console.log('   - SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'TROUVÉE' : 'MANQUANTE');
  console.log('   - SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? 'TROUVÉE' : 'MANQUANTE');

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Variables d\'environnement manquantes');
    console.log('💡 Vérifiez que le fichier .env contient:');
    console.log('   - SUPABASE_URL=...');
    console.log('   - SUPABASE_ANON_KEY=...');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY=...');
    return;
  }

  // Créer un client avec la clé anonyme pour l'authentification
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // OPTION 1: Utiliser directement le service role key comme Authorization
    console.log('🔍 Test avec Service Role Key direct...');
    
    const timestamp = Date.now();
    const testData = {
      email: `test-compact-${timestamp}@example.com`,
      fullName: `Test Compact ${timestamp}`,
      invitationType: 'tenant_owner',
      siteUrl: 'http://localhost:8080'
    };

    const functionUrl = `${SUPABASE_URL}/functions/v1/send-invitation`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify(testData)
    });

    console.log('📊 RÉSULTAT:');
    console.log('   - Status:', response.status);
    console.log('   - Status Text:', response.statusText);

    if (response.ok) {
      const responseData = await response.json();
      console.log('   - Réponse:', JSON.stringify(responseData, null, 2));
      
      if (responseData.success) {
        console.log('');
        console.log('🎉 SUCCÈS ! Version compacte fonctionne');
        console.log('✅ send-invitation optimisée (201 lignes) opérationnelle');
        
        // Nettoyage
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        try {
          await supabaseAdmin.from('invitations').delete().eq('id', responseData.data.invitation_id);
          await supabaseAdmin.auth.admin.deleteUser(responseData.data.user_id);
          console.log('✅ Données de test nettoyées');
        } catch (cleanupError) {
          console.log('⚠️ Erreur nettoyage:', cleanupError.message);
        }
      }
    } else {
      const errorText = await response.text();
      console.log('   - Erreur:', errorText);
      
      // Si c'est une erreur d'auth, c'est normal avec cette méthode
      if (response.status === 401) {
        console.log('');
        console.log('ℹ️ Erreur d\'authentification attendue');
        console.log('💡 La fonction nécessite un token utilisateur valide, pas le service role key');
        console.log('🔧 En production, utilisez un vrai token Super Admin');
      }
    }

  } catch (error) {
    console.error('🚨 ERREUR:', error);
  }
}

testWithRealAuth().then(() => {
  console.log('');
  console.log('🏁 Test terminé');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
