#!/usr/bin/env node

/**
 * Vérifier les données d'invitation et tenant pour medtest1@yahoo.com
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://qliinxtanjdnwxlvnxji.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TEST_EMAIL = 'medtest1@yahoo.com';

async function checkInvitationTenant() {
  console.log('🔍 VÉRIFICATION: Invitation et Tenant');
  console.log('📧 Email:', TEST_EMAIL);
  console.log('⏰ Début:', new Date().toISOString());
  console.log('=' .repeat(60));

  try {
    // 1. Vérifier invitation
    console.log('\n📋 ÉTAPE 1: Invitation...');
    
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .eq('email', TEST_EMAIL)
      .eq('invitation_type', 'tenant_owner')
      .single();

    if (invitationError || !invitation) {
      console.log('❌ Pas d\'invitation trouvée:', invitationError?.message);
      return;
    }

    console.log('✅ Invitation trouvée:');
    console.log('  - ID:', invitation.id);
    console.log('  - Email:', invitation.email);
    console.log('  - Tenant ID:', invitation.tenant_id);
    console.log('  - Status:', invitation.status);
    console.log('  - Full Name:', invitation.full_name);

    // 2. Vérifier si tenant existe
    console.log('\n🏢 ÉTAPE 2: Tenant...');
    
    if (invitation.tenant_id) {
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', invitation.tenant_id)
        .single();

      if (tenantError || !tenant) {
        console.log('❌ Tenant manquant pour ID:', invitation.tenant_id);
        console.log('Erreur:', tenantError?.message);
        
        // Créer le tenant manquant
        console.log('\n🔧 Création du tenant manquant...');
        const { data: newTenant, error: createError } = await supabase
          .from('tenants')
          .insert({
            id: invitation.tenant_id,
            name: invitation.full_name ? `${invitation.full_name}'s Company` : `${TEST_EMAIL.split('@')[0]}'s Company`,
            created_at: new Date().toISOString()
          })
          .select('*')
          .single();

        if (createError) {
          console.log('❌ Erreur création tenant:', createError.message);
        } else {
          console.log('✅ Tenant créé:', newTenant.name);
        }
      } else {
        console.log('✅ Tenant existe:');
        console.log('  - ID:', tenant.id);
        console.log('  - Name:', tenant.name);
        console.log('  - Created:', tenant.created_at);
      }
    } else {
      console.log('❌ Pas de tenant_id dans l\'invitation');
    }

    // 3. Vérifier contraintes FK
    console.log('\n🔗 ÉTAPE 3: Contraintes...');
    
    try {
      const { data: constraints } = await supabase.rpc('exec_sql', { 
        sql: `
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'profiles'
  AND kcu.column_name = 'tenant_id';`
      });
      
      if (constraints && constraints.length > 0) {
        console.log('✅ Contrainte FK profiles.tenant_id trouvée:');
        constraints.forEach(c => {
          console.log(`  - ${c.table_name}.${c.column_name} -> ${c.foreign_table_name}.${c.foreign_column_name}`);
        });
      } else {
        console.log('❌ Pas de contrainte FK sur profiles.tenant_id');
      }
    } catch (error) {
      console.log('❌ Erreur vérification contraintes:', error.message);
    }

  } catch (error) {
    console.error('💥 ERREUR:', error);
  }

  console.log('\n' + '=' .repeat(60));
  console.log('⏰ Fin:', new Date().toISOString());
}

checkInvitationTenant()
  .then(() => {
    console.log('🏁 Vérification terminée');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
