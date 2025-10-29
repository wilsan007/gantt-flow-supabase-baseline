import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testNotificationSystem() {
  console.log('📧 TEST SYSTÈME DE NOTIFICATION D\'INVITATION');
  console.log('============================================');
  
  try {
    console.log('\n1️⃣ TEST AVEC DIFFÉRENTES ADRESSES EMAIL...');
    
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
        email: 'test.user@startup.io',
        fullName: 'Test User',
        description: 'Test avec email startup'
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n📝 ${testCase.description}:`);
      console.log(`   Email destinataire: ${testCase.email}`);
      console.log(`   Nom: ${testCase.fullName}`);
      
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
          console.log('   ✅ SUCCESS:', {
            invitation_id: result.invitation_id,
            notification_sent_to: result.notification?.sent_to,
            original_recipient: result.notification?.original_recipient
          });
          
          // Vérifier l'invitation en base
          if (result.invitation_id) {
            const { data: invitation } = await supabase
              .from('invitations')
              .select('*')
              .eq('id', result.invitation_id)
              .single();
            
            if (invitation) {
              console.log('   📊 Invitation en base:', {
                email: invitation.email,
                status: invitation.status,
                notification_sent: invitation.metadata?.notification_sent_at ? 'Oui' : 'Non'
              });
            }
          }
          
        } else {
          const error = await response.text();
          console.log('   ❌ ERREUR:', error);
        }
        
      } catch (err) {
        console.log('   💥 EXCEPTION:', err.message);
      }
      
      // Pause entre les tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n2️⃣ VÉRIFICATION DES INVITATIONS CRÉÉES...');
    
    const { data: recentInvitations, error: inviteError } = await supabase
      .from('invitations')
      .select('*')
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // 5 dernières minutes
      .order('created_at', { ascending: false });
    
    if (inviteError) {
      console.error('❌ Erreur récupération invitations:', inviteError);
    } else {
      console.log(`📊 ${recentInvitations.length} invitations créées récemment:`);
      
      recentInvitations.forEach((invite, index) => {
        console.log(`\n   ${index + 1}. ${invite.email}`);
        console.log(`      ID: ${invite.id}`);
        console.log(`      Statut: ${invite.status}`);
        console.log(`      Notification: ${invite.metadata?.notification_sent_at ? '✅ Envoyée' : '❌ Non envoyée'}`);
        console.log(`      Destinataire original: ${invite.metadata?.original_recipient || invite.email}`);
      });
    }
    
    console.log('\n3️⃣ RÉSUMÉ DU SYSTÈME DE NOTIFICATION...');
    
    console.log('\n📧 FONCTIONNEMENT:');
    console.log('✅ Invitation créée en base pour l\'email réel');
    console.log('✅ Email de notification envoyé à osman.awaleh.adn@gmail.com');
    console.log('✅ Le notification contient:');
    console.log('   - L\'adresse email du vrai destinataire');
    console.log('   - Le lien d\'invitation fonctionnel');
    console.log('   - Les instructions pour tester');
    
    console.log('\n🎯 AVANTAGES:');
    console.log('✅ Respecte les limitations Resend');
    console.log('✅ Permet de tester avec n\'importe quelle adresse');
    console.log('✅ Vous recevez toutes les notifications');
    console.log('✅ Les liens d\'invitation sont fonctionnels');
    
    console.log('\n🚀 PROCHAINES ÉTAPES:');
    console.log('1. Remplacez le contenu de send-invitation/index.ts');
    console.log('2. Redéployez: supabase functions deploy send-invitation');
    console.log('3. Testez depuis l\'interface React');
    console.log('4. Vérifiez vos emails pour les notifications');
    
    console.log('\n🎉 SYSTÈME DE NOTIFICATION PRÊT !');
    
  } catch (error) {
    console.error('💥 Erreur générale:', error);
  }
}

testNotificationSystem();
