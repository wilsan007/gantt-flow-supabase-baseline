// Test de création de tenant pour utilisateur existant
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg2MTMsImV4cCI6MjA3Mjc0NDYxM30.13wLfMNJ2Joxpw9GWq2_ymJgPtQizZZUzRUDNVRhQzM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testExistingUserCreation() {
  const userEmail = 'imran77@yyahoo.com';
  
  console.log('🚀 Test création tenant pour utilisateur existant');
  console.log('Email:', userEmail);
  console.log('=' .repeat(50));

  try {
    // Appeler la fonction pour créer le tenant
    const { data: result, error } = await supabase
      .rpc('create_tenant_for_existing_user', { 
        user_email: userEmail 
      });

    console.log('\n📊 Résultat:');
    console.log('- Data:', result);
    console.log('- Error:', error);

    if (error) {
      console.error('❌ Erreur:', error);
      return;
    }

    if (result && result.success) {
      console.log('\n✅ SUCCÈS ! Tenant créé pour l\'utilisateur existant');
      console.log('📋 Détails:');
      console.log('- User ID:', result.user_id);
      console.log('- Tenant ID:', result.tenant_id);
      console.log('- Nom entreprise:', result.tenant_name);
      console.log('- Employee ID:', result.employee_id);
      
      console.log('\n🎉 L\'utilisateur peut maintenant accéder à son dashboard !');
    } else {
      console.log('❌ Échec:', result?.error || 'Erreur inconnue');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testExistingUserCreation();
