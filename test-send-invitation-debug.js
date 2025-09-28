import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function testSendInvitation() {
  console.log('🧪 TEST: Envoi d\'invitation avec debug');
  console.log('=====================================\n');

  try {
    // Utiliser directement le service role key pour tester l'Edge Function
    console.log('🔑 Test avec service role key (pas besoin de connexion)');

    // Données de test
    const invitationData = {
      email: 'test-debug@example.com',
      fullName: 'Test Debug User',
      companyName: 'Debug Company',
      siteUrl: 'http://localhost:8081'
    };

    console.log('📧 Envoi invitation avec données:', invitationData);

    // D'abord se connecter comme super admin pour obtenir un token valide
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'awalehnasri@gmail.com',
      password: 'votre_mot_de_passe_ici' // Remplacer par le bon mot de passe
    });

    if (signInError) {
      console.error('❌ Erreur connexion super admin:', signInError);
      console.log('🔧 Utilisation du service role key directement...');
      
      // Appeler l'Edge Function avec service role key
      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/send-invitation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'apikey': process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
        },
        body: JSON.stringify(invitationData)
      });

      const result = await response.text();
      console.log('📊 Réponse brute:', response.status, result);
      
      if (!response.ok) {
        console.error('❌ ERREUR HTTP:', response.status, response.statusText);
        console.error('   - Réponse:', result);
      } else {
        console.log('✅ SUCCÈS:', JSON.parse(result));
      }
      return;
    }

    console.log('✅ Connecté comme super admin:', signInData.user.email);

    // Appeler l'Edge Function avec le token utilisateur
    const { data, error } = await supabase.functions.invoke('send-invitation', {
      body: invitationData
    });

    if (error) {
      console.error('❌ ERREUR EDGE FUNCTION:');
      console.error('   - Status:', error.status);
      console.error('   - Message:', error.message);
      console.error('   - Détails complets:', error);
      
      // Essayer de récupérer plus de détails
      if (error.context) {
        console.error('   - Contexte:', error.context);
      }
    } else {
      console.log('✅ SUCCÈS:');
      console.log('   - Données retournées:', data);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testSendInvitation();
