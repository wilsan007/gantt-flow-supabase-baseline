import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testErrorHandling() {
  console.log('🧪 TEST DE GESTION D\'ERREURS');
  console.log('============================');
  
  const testCases = [
    {
      name: 'Email déjà existant',
      data: {
        email: 'osman.awaleh.adn@gmail.com', // Email qui existe déjà
        fullName: 'Test Existing Email',
        invitationType: 'tenant_owner',
        siteUrl: 'http://localhost:8080'
      },
      expectedError: 'EMAIL_ALREADY_EXISTS'
    },
    {
      name: 'Email invalide',
      data: {
        email: 'email-invalide-sans-arobase',
        fullName: 'Test Invalid Email',
        invitationType: 'tenant_owner',
        siteUrl: 'http://localhost:8080'
      },
      expectedError: 'INVALID_EMAIL_FORMAT'
    },
    {
      name: 'Données manquantes - Email',
      data: {
        fullName: 'Test Missing Email',
        invitationType: 'tenant_owner',
        siteUrl: 'http://localhost:8080'
      },
      expectedError: 'Email et nom complet requis'
    },
    {
      name: 'Données manquantes - Nom',
      data: {
        email: 'test-missing-name@example.com',
        invitationType: 'tenant_owner',
        siteUrl: 'http://localhost:8080'
      },
      expectedError: 'Email et nom complet requis'
    },
    {
      name: 'Email valide (devrait réussir)',
      data: {
        email: `test-success-${Date.now()}@example.com`,
        fullName: 'Test Success User',
        invitationType: 'tenant_owner',
        siteUrl: 'http://localhost:8080'
      },
      expectedError: null
    }
  ];
  
  const results = [];
  
  for (const testCase of testCases) {
    console.log(`\n🔍 Test: ${testCase.name}`);
    console.log(`   Email: ${testCase.data.email || 'MANQUANT'}`);
    console.log(`   Nom: ${testCase.data.fullName || 'MANQUANT'}`);
    
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/send-invitation`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testCase.data),
        }
      );
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('   ✅ SUCCÈS:', result.message || 'Invitation créée');
        results.push({
          test: testCase.name,
          status: 'SUCCESS',
          expected: testCase.expectedError,
          actual: 'SUCCESS'
        });
        
        // Nettoyer l'invitation créée
        if (result.invitation_id) {
          await supabase.from('invitations').delete().eq('id', result.invitation_id);
          console.log('   🧹 Invitation nettoyée');
        }
        
      } else {
        console.log('   ❌ ERREUR:', result.error);
        console.log('   📝 Code:', result.code);
        console.log('   💡 Message:', result.message);
        console.log('   🔧 Suggestion:', result.details?.suggestion);
        
        results.push({
          test: testCase.name,
          status: 'ERROR',
          expected: testCase.expectedError,
          actual: result.code || result.error
        });
      }
      
    } catch (err) {
      console.log('   💥 EXCEPTION:', err.message);
      results.push({
        test: testCase.name,
        status: 'EXCEPTION',
        expected: testCase.expectedError,
        actual: err.message
      });
    }
    
    // Pause entre les tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Résumé des résultats
  console.log('\n📊 RÉSUMÉ DES TESTS DE GESTION D\'ERREURS');
  console.log('========================================');
  
  results.forEach((result, index) => {
    const testCase = testCases[index];
    const isExpected = testCase.expectedError === null ? 
      result.status === 'SUCCESS' : 
      result.actual.includes(testCase.expectedError) || result.actual === testCase.expectedError;
    
    console.log(`\n${index + 1}. ${result.test}`);
    console.log(`   Attendu: ${testCase.expectedError || 'SUCCÈS'}`);
    console.log(`   Obtenu: ${result.actual}`);
    console.log(`   Résultat: ${isExpected ? '✅ CONFORME' : '❌ NON CONFORME'}`);
  });
  
  const conformeCount = results.filter((result, index) => {
    const testCase = testCases[index];
    return testCase.expectedError === null ? 
      result.status === 'SUCCESS' : 
      result.actual.includes(testCase.expectedError) || result.actual === testCase.expectedError;
  }).length;
  
  console.log(`\n🎯 Taux de conformité: ${(conformeCount / results.length * 100).toFixed(1)}% (${conformeCount}/${results.length})`);
  
  if (conformeCount === results.length) {
    console.log('🎉 TOUTES LES GESTIONS D\'ERREURS FONCTIONNENT CORRECTEMENT !');
    console.log('\n✅ AMÉLIORATIONS APPORTÉES:');
    console.log('- Gestion claire de l\'erreur "email déjà utilisé"');
    console.log('- Messages d\'erreur explicites et en français');
    console.log('- Codes d\'erreur structurés pour l\'interface');
    console.log('- Suggestions d\'actions pour chaque erreur');
    console.log('- Distinction entre erreurs utilisateur et système');
  } else {
    console.log('⚠️ Certaines gestions d\'erreurs nécessitent des ajustements');
  }
  
  console.log('\n🚀 PROCHAINES ÉTAPES:');
  console.log('1. Redéployez la fonction: supabase functions deploy send-invitation');
  console.log('2. Testez depuis l\'interface React');
  console.log('3. Les erreurs seront maintenant claires et utiles pour l\'utilisateur');
}

testErrorHandling();
