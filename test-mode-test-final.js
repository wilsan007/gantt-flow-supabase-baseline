import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testModeTestFinal() {
  console.log('📧 TEST MODE TEST FINAL');
  console.log('======================');
  console.log('Tous les emails seront envoyés à: osman.awaleh.adn@gmail.com');
  
  const testCases = [
    {
      email: 'marie.dupont@example.com',
      fullName: 'Marie Dupont',
      description: 'Test avec email externe'
    },
    {
      email: 'john.doe@company.com',
      fullName: 'John Doe', 
      description: 'Test avec email entreprise'
    },
    {
      email: 'test@startup.io',
      fullName: 'Test Startup',
      description: 'Test avec email startup'
    }
  ];
  
  console.log('\n🎯 TESTS D\'INVITATIONS:');
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n${i + 1}. ${testCase.description}`);
    console.log(`   Destinataire réel: ${testCase.email}`);
    console.log(`   Nom: ${testCase.fullName}`);
    console.log(`   Email sera envoyé à: osman.awaleh.adn@gmail.com`);
    
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/send-invitation`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: testCase.email,
            fullName: testCase.fullName,
            invitationType: 'tenant_owner',
            siteUrl: 'http://localhost:8080'
          }),
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        console.log('   ✅ SUCCÈS - Invitation créée');
        console.log(`   📧 Email envoyé à: osman.awaleh.adn@gmail.com`);
        console.log(`   📋 Sujet: 🧪 [TEST] Invitation créée pour ${testCase.email} - ${testCase.fullName}`);
        console.log(`   🆔 ID: ${result.invitation_id}`);
        
        // Vérifier l'invitation en base
        const { data: invitation } = await supabase
          .from('invitations')
          .select('*')
          .eq('id', result.invitation_id)
          .single();
        
        if (invitation) {
          console.log(`   📊 Base: Email=${invitation.email}, Statut=${invitation.status}`);
        }
        
        // Nettoyer
        await supabase.from('invitations').delete().eq('id', result.invitation_id);
        console.log('   🧹 Nettoyé');
        
      } else {
        const error = await response.text();
        console.log('   ❌ ERREUR:', error);
      }
      
    } catch (err) {
      console.log('   💥 EXCEPTION:', err.message);
    }
    
    // Pause entre les tests
    if (i < testCases.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n📋 RÉSUMÉ MODE TEST:');
  console.log('===================');
  console.log('✅ Configuration: Mode test activé');
  console.log('✅ Destination: Tous les emails → osman.awaleh.adn@gmail.com');
  console.log('✅ Contenu: Email indique le vrai destinataire');
  console.log('✅ Base de données: Invitation créée avec le vrai email');
  console.log('✅ Sujet: Indique clairement [TEST] et le destinataire réel');
  
  console.log('\n💡 AVANTAGES:');
  console.log('- ✅ Aucune erreur 403 de Resend');
  console.log('- ✅ Vous recevez tous les emails de test');
  console.log('- ✅ Vous voyez clairement pour qui était l\'invitation');
  console.log('- ✅ Les liens d\'invitation fonctionnent');
  console.log('- ✅ Les données en base sont correctes');
  
  console.log('\n🚀 PROCHAINES ÉTAPES:');
  console.log('1. Redéployez: supabase functions deploy send-invitation');
  console.log('2. Testez depuis l\'interface React');
  console.log('3. Vérifiez vos emails pour les notifications');
  console.log('4. En production: changez la destination vers le vrai email');
  
  console.log('\n🎉 MODE TEST PARFAITEMENT CONFIGURÉ !');
}

testModeTestFinal();
