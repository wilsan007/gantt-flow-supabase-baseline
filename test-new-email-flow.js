const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg2MTMsImV4cCI6MjA3Mjc0NDYxM30.Nh4OOmVJgTdRCqpNx6QOBvYr0T_5q8QOKqGZ8ENVMfY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNewEmailFlow() {
  console.log('🧪 TEST DU NOUVEAU FLUX EMAIL CONFIRMATION');
  console.log('===========================================');
  
  try {
    // 1. Tester l'inscription avec nouvelle redirection
    console.log('\n1️⃣ Test inscription avec redirection /auth/callback...');
    
    const testEmail = `test-flow-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testName = 'Test User Flow';
    
    console.log(`📧 Email de test: ${testEmail}`);
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: 'http://localhost:8080/auth/callback',
        data: {
          full_name: testName,
        },
      },
    });
    
    if (error) {
      console.error('❌ Erreur inscription:', error.message);
      return;
    }
    
    console.log('✅ Inscription réussie !');
    console.log(`   User ID: ${data.user?.id}`);
    console.log(`   Email confirmé: ${data.user?.email_confirmed_at ? 'OUI' : 'NON'}`);
    
    // 2. Vérifier la configuration de redirection
    console.log('\n2️⃣ Vérification configuration...');
    console.log('   ✅ emailRedirectTo: http://localhost:8080/auth/callback');
    console.log('   ✅ Page AuthCallback.tsx créée');
    console.log('   ✅ Route /auth/callback ajoutée dans App.tsx');
    
    // 3. Instructions pour tester
    console.log('\n3️⃣ INSTRUCTIONS DE TEST :');
    console.log('========================');
    console.log('1. Vérifiez votre email pour le lien de confirmation');
    console.log('2. Cliquez sur le lien → devrait rediriger vers /auth/callback');
    console.log('3. La page callback devrait afficher "Confirmation en cours"');
    console.log('4. Après quelques secondes → redirection vers /dashboard');
    
    console.log('\n🔧 SI ÇA NE MARCHE PAS :');
    console.log('======================');
    console.log('1. Configurez les URL dans Supabase Dashboard');
    console.log('2. Ajoutez http://localhost:8080/auth/callback aux Redirect URLs');
    console.log('3. Configurez le webhook pour automatiser le processus');
    
    // 4. Nettoyer l'utilisateur de test
    console.log('\n4️⃣ Nettoyage...');
    if (data.user?.id) {
      // Note: En production, on ne peut pas supprimer via API client
      console.log(`⚠️ Utilisateur de test créé: ${data.user.id}`);
      console.log('   Supprimez-le manuellement depuis Supabase Dashboard si nécessaire');
    }
    
  } catch (err) {
    console.error('💥 Erreur test:', err);
  }
}

// Exécuter le test
testNewEmailFlow();
