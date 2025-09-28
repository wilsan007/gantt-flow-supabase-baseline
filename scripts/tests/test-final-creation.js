// Test final après correction de la contrainte employee_id
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg2MTMsImV4cCI6MjA3Mjc0NDYxM30.13wLfMNJ2Joxpw9GWq2_ymJgPtQizZZUzRUDNVRhQzM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFinalCreation() {
  const userEmail = 'imran33@yahoo.com';
  
  console.log('🎯 TEST FINAL CRÉATION TENANT OWNER');
  console.log('Email:', userEmail);
  console.log('=' .repeat(60));

  try {
    // Test de la fonction debug corrigée
    const { data: result, error } = await supabase
      .rpc('debug_tenant_creation', { 
        user_email: userEmail 
      });

    if (error) {
      console.log('❌ ERREUR RPC:', error);
      return;
    }

    console.log('\n📊 RÉSULTAT:');
    console.log('- Success:', result?.success);
    
    if (result?.success) {
      console.log('\n🎉 CRÉATION RÉUSSIE!');
      console.log('- User ID:', result.user_id);
      console.log('- Tenant ID:', result.tenant_id);
      console.log('- Entreprise:', result.tenant_name);
      console.log('- Employee ID:', result.employee_id);
      console.log('- Employee Record ID:', result.employee_record_id);
      
      // Vérifier les données créées
      console.log('\n🔍 VÉRIFICATION DES DONNÉES:');
      
      // Vérifier le tenant
      const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', result.tenant_id)
        .single();
      
      console.log('- Tenant créé:', tenant ? '✅' : '❌');
      
      // Vérifier le profil
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', result.user_id)
        .single();
      
      console.log('- Profil créé:', profile ? '✅' : '❌');
      
      // Vérifier l'employé
      const { data: employee } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', result.user_id)
        .single();
      
      console.log('- Employé créé:', employee ? '✅' : '❌');
      
      // Vérifier les rôles
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('*, roles(name)')
        .eq('user_id', result.user_id);
      
      console.log('- Rôles assignés:', userRoles?.length || 0);
      if (userRoles?.length > 0) {
        userRoles.forEach(role => {
          console.log(`  - ${role.roles.name} (${role.is_active ? 'actif' : 'inactif'})`);
        });
      }
      
      // Vérifier l'invitation
      const { data: invitation } = await supabase
        .from('invitations')
        .select('*')
        .eq('email', userEmail)
        .single();
      
      console.log('- Invitation mise à jour:', invitation?.status === 'accepted' ? '✅' : '❌');
      
    } else {
      console.log('\n❌ CRÉATION ÉCHOUÉE');
      console.log('Raison:', result?.error);
      
      if (result?.debug_log) {
        console.log('\n📋 LOGS DÉTAILLÉS:');
        console.log(result.debug_log);
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testFinalCreation();
