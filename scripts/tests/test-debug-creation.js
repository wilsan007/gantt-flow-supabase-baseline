// Test de la fonction debug avec logs détaillés
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg2MTMsImV4cCI6MjA3Mjc0NDYxM30.13wLfMNJ2Joxpw9GWq2_ymJgPtQizZZUzRUDNVRhQzM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDebugCreation() {
  const userEmail = 'imran33@yahoo.com';
  
  console.log('🔍 TEST DEBUG CRÉATION TENANT');
  console.log('Email:', userEmail);
  console.log('=' .repeat(60));

  try {
    // Appeler la fonction debug
    const { data: result, error } = await supabase
      .rpc('debug_tenant_creation', { 
        user_email: userEmail 
      });

    console.log('\n📊 RÉSULTAT COMPLET:');
    console.log('- Error:', error);
    console.log('- Success:', result?.success);
    console.log('- Message:', result?.error || result?.message);
    
    if (result?.debug_log) {
      console.log('\n📋 LOGS DÉTAILLÉS:');
      console.log(result.debug_log);
    }

    if (result?.success) {
      console.log('\n✅ CRÉATION RÉUSSIE!');
      console.log('- User ID:', result.user_id);
      console.log('- Tenant ID:', result.tenant_id);
      console.log('- Entreprise:', result.tenant_name);
      console.log('- Employee ID:', result.employee_id);
    } else {
      console.log('\n❌ CRÉATION ÉCHOUÉE');
      console.log('Raison:', result?.error);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testDebugCreation();
