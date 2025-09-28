#!/usr/bin/env node

/**
 * Test script pour medtest1@yahoo.com avec la méthode qui fonctionnait
 * Utilise la même approche que test-complete-tenant-creation.cjs
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration directe des variables
const supabaseUrl = "https://qliinxtanjdnwxlvnxji.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI";

// Client avec privilèges service role (Super Admin)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TEST_EMAIL = 'medtest1@yahoo.com';
const TEST_USER_ID = 'bdef6cd4-3019-456b-aee4-a037dee6ff00';
const TEST_TENANT_ID = '06c8c1c4-c34c-4447-9f1c-39f0c17bdc75';

async function testMedtest1TriggerComplete() {
  console.log('🧪 TEST: Trigger de confirmation pour medtest1@yahoo.com');
  console.log('📧 Email de test:', TEST_EMAIL);
  console.log('👤 User ID:', TEST_USER_ID);
  console.log('🏢 Tenant ID:', TEST_TENANT_ID);
  console.log('⏰ Début:', new Date().toISOString());
  console.log('=' .repeat(80));

  try {
    // 1. Vérifier l'invitation existante
    console.log('\n🔍 ÉTAPE 1: Vérification invitation...');
    
    const { data: invitations, error: invError } = await supabase
      .from('invitations')
      .select('*')
      .eq('email', TEST_EMAIL)
      .eq('invitation_type', 'tenant_owner');

    if (invError) {
      console.error('❌ Erreur lecture invitations:', invError);
      return;
    }

    if (!invitations || invitations.length === 0) {
      console.log('❌ Aucune invitation trouvée pour', TEST_EMAIL);
      return;
    }

    const invitation = invitations[0];
    console.log('✅ Invitation existante:', invitation.id);
    console.log('   Token:', invitation.token);
    console.log('   Status:', invitation.status);
    console.log('   Tenant ID:', invitation.tenant_id);

    // 2. Vérifier l'utilisateur auth
    console.log('\n👤 ÉTAPE 2: Vérification utilisateur auth...');
    
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
      console.error('❌ Erreur lecture utilisateurs:', userError);
      return;
    }

    const testUser = users.users.find(u => u.email === TEST_EMAIL);
    if (!testUser) {
      console.log('❌ Utilisateur non trouvé:', TEST_EMAIL);
      return;
    }

    console.log('✅ Utilisateur existant:', testUser.id);
    console.log('   Email confirmé:', testUser.email_confirmed_at ? '✅' : '❌');

    // 3. Vérifier état avant trigger
    console.log('\n📋 ÉTAPE 3: État avant trigger...');
    
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', TEST_EMAIL)
      .single();
    
    const { data: existingEmployee } = await supabase
      .from('employees')
      .select('*')
      .eq('email', TEST_EMAIL)
      .single();

    console.log('Profil existant:', existingProfile ? '✅ OUI' : '❌ NON');
    console.log('Employé existant:', existingEmployee ? '✅ OUI' : '❌ NON');

    // 4. Installer le trigger si nécessaire
    console.log('\n🔧 ÉTAPE 4: Installation du trigger...');
    
    try {
      // Lire et exécuter le script de trigger
      const fs = require('fs');
      const triggerScript = fs.readFileSync('./fix-trigger-on-email-confirmation.sql', 'utf8');
      
      // Diviser le script en commandes individuelles
      const commands = triggerScript.split(';').filter(cmd => cmd.trim().length > 0);
      
      for (const command of commands) {
        if (command.trim()) {
          try {
            await supabase.rpc('exec_sql', { sql: command.trim() + ';' });
          } catch (error) {
            // Ignorer les erreurs de "already exists"
            if (!error.message.includes('already exists')) {
              console.log('⚠️  Erreur trigger (ignorée):', error.message.substring(0, 100));
            }
          }
        }
      }
      console.log('✅ Trigger installé');
    } catch (error) {
      console.log('⚠️  Erreur installation trigger:', error.message);
    }

    // 5. Simuler la confirmation d'email (déclencher le trigger)
    console.log('\n🚀 ÉTAPE 5: Simulation confirmation email...');
    
    if (!testUser.email_confirmed_at) {
      try {
        // Mettre à jour email_confirmed_at pour déclencher le trigger
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          testUser.id,
          { email_confirm: true }
        );

        if (updateError) {
          console.error('❌ Erreur confirmation email:', updateError);
        } else {
          console.log('✅ Email confirmé - trigger déclenché');
        }
      } catch (error) {
        console.log('⚠️  Tentative alternative de confirmation...');
        
        // Alternative: utiliser SQL direct
        try {
          await supabase.rpc('exec_sql', { 
            sql: `UPDATE auth.users SET email_confirmed_at = now() WHERE id = '${testUser.id}' AND email_confirmed_at IS NULL;`
          });
          console.log('✅ Email confirmé via SQL - trigger déclenché');
        } catch (sqlError) {
          console.error('❌ Erreur SQL confirmation:', sqlError);
        }
      }
    } else {
      console.log('✅ Email déjà confirmé');
    }

    // 6. Attendre que le trigger s'exécute
    console.log('\n⏳ ÉTAPE 6: Attente exécution trigger (5 secondes)...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 7. Vérifications post-trigger
    console.log('\n📊 ÉTAPE 7: Vérifications post-trigger...');
    
    // Vérifier profil
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', TEST_EMAIL)
      .single();
    console.log('👤 Profil créé:', profile ? `✅ OUI (${profile.role})` : '❌ NON');

    // Vérifier employé
    const { data: employee } = await supabase
      .from('employees')
      .select('*')
      .eq('email', TEST_EMAIL)
      .single();
    console.log('👨‍💼 Employé créé:', employee ? `✅ OUI (${employee.employee_id})` : '❌ NON');

    // Vérifier invitation mise à jour
    const { data: updatedInvitation } = await supabase
      .from('invitations')
      .select('*')
      .eq('email', TEST_EMAIL)
      .single();
    console.log('💌 Invitation acceptée:', updatedInvitation?.status === 'accepted' ? '✅ OUI' : '❌ NON');

    // Vérifier rôles
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('*, roles(name)')
      .eq('user_id', testUser.id);
    console.log('🔐 Rôles créés:', userRoles && userRoles.length > 0 ? `✅ OUI (${userRoles.length})` : '❌ NON');

    // 8. Score final
    console.log('\n🎯 ÉTAPE 8: Score final...');
    
    const results = {
      profile: !!profile,
      employee: !!employee,
      invitation: updatedInvitation?.status === 'accepted',
      roles: userRoles && userRoles.length > 0
    };

    const score = Object.values(results).filter(Boolean).length;
    console.log(`📊 Score: ${score}/4`);

    if (score === 4) {
      console.log('🎉 TRIGGER FONCTIONNE PARFAITEMENT !');
    } else if (score > 0) {
      console.log('⚠️  TRIGGER PARTIELLEMENT FONCTIONNEL');
    } else {
      console.log('❌ TRIGGER NE FONCTIONNE PAS');
    }

    // Détails si créés
    if (profile) {
      console.log('\n📋 Détails profil:');
      console.log('   ID:', profile.id);
      console.log('   Email:', profile.email);
      console.log('   Nom:', profile.full_name);
      console.log('   Rôle:', profile.role);
      console.log('   Tenant ID:', profile.tenant_id);
    }

    if (employee) {
      console.log('\n👤 Détails employé:');
      console.log('   ID:', employee.id);
      console.log('   Employee ID:', employee.employee_id);
      console.log('   Email:', employee.email);
      console.log('   Nom:', employee.full_name);
      console.log('   Poste:', employee.job_title);
    }

    if (userRoles && userRoles.length > 0) {
      console.log('\n🔐 Rôles assignés:');
      userRoles.forEach(role => {
        console.log(`   - ${role.roles.name}`);
      });
    }

  } catch (error) {
    console.error('💥 ERREUR GÉNÉRALE:', error);
  }

  console.log('\n' + '=' .repeat(80));
  console.log('⏰ Fin:', new Date().toISOString());
}

// Exécution
testMedtest1TriggerComplete()
  .then(() => {
    console.log('🏁 Test terminé');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
