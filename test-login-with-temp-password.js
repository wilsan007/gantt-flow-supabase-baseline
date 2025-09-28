import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY // Utiliser la clé anon pour la connexion utilisateur
);

async function testLoginWithTempPassword() {
  console.log('🔐 TEST CONNEXION AVEC MOT DE PASSE TEMPORAIRE');
  console.log('=============================================\n');

  const credentials = {
    email: "test545@yahoo.com",
    password: "phl1othd5AFO1!"
  };

  try {
    console.log('1️⃣ Tentative de connexion...');
    console.log(`   Email: ${credentials.email}`);
    console.log(`   Password: ${credentials.password}`);

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    });

    if (signInError) {
      console.log(`❌ Connexion échouée: ${signInError.message}`);
      console.log(`   Code erreur: ${signInError.error_code || 'Non spécifié'}`);
      
      if (signInError.message.includes('Email not confirmed')) {
        console.log('\n🔧 SOLUTION: Email non confirmé');
        console.log('   1. Aller dans Supabase Dashboard > Authentication > Users');
        console.log(`   2. Chercher l'utilisateur ${credentials.email}`);
        console.log('   3. Cliquer sur "Confirm email"');
        console.log('   4. Réessayer la connexion');
      }
      
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('\n🔧 SOLUTION: Mot de passe incorrect');
        console.log('   1. Vérifier le mot de passe dans l\'invitation');
        console.log('   2. Ou réinitialiser le mot de passe');
      }
      
      return;
    }

    console.log('✅ Connexion réussie !');
    console.log(`   User ID: ${signInData.user.id}`);
    console.log(`   Email: ${signInData.user.email}`);
    console.log(`   Email confirmé: ${signInData.user.email_confirmed_at ? '✅ OUI' : '❌ NON'}`);

    // 2. Vérifier les données utilisateur après connexion
    console.log('\n2️⃣ Vérification des données utilisateur...');
    
    // Utiliser le client avec service role pour les vérifications
    const adminSupabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    );

    // Vérifier le profil
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('user_id', signInData.user.id)
      .single();

    if (profile) {
      console.log(`✅ Profil trouvé: ${profile.full_name}`);
      console.log(`   - Tenant ID: ${profile.tenant_id}`);
      console.log(`   - Rôle: ${profile.role}`);
    } else {
      console.log('❌ Profil non trouvé');
      console.log('   Le trigger ne s\'est pas exécuté correctement');
    }

    // Vérifier le tenant
    if (profile?.tenant_id) {
      const { data: tenant, error: tenantError } = await adminSupabase
        .from('tenants')
        .select('*')
        .eq('id', profile.tenant_id)
        .single();

      if (tenant) {
        console.log(`✅ Tenant: ${tenant.name}`);
        console.log(`   - Status: ${tenant.status}`);
      } else {
        console.log('❌ Tenant non trouvé');
      }
    }

    // Vérifier l'employé
    const { data: employee, error: empError } = await adminSupabase
      .from('employees')
      .select('*')
      .eq('user_id', signInData.user.id)
      .single();

    if (employee) {
      console.log(`✅ Employé: ${employee.employee_id}`);
      console.log(`   - Nom: ${employee.full_name}`);
      console.log(`   - Poste: ${employee.job_title}`);
    } else {
      console.log('❌ Employé non trouvé');
    }

    // Vérifier les rôles
    const { data: userRoles, error: rolesError } = await adminSupabase
      .from('user_roles')
      .select('*, roles(name)')
      .eq('user_id', signInData.user.id);

    if (userRoles && userRoles.length > 0) {
      console.log(`✅ Rôles: ${userRoles.length}`);
      userRoles.forEach(role => {
        console.log(`   - ${role.roles.name}`);
      });
    } else {
      console.log('❌ Aucun rôle assigné');
    }

    // 3. Vérifier l'invitation
    console.log('\n3️⃣ Vérification de l\'invitation...');
    const { data: invitation, error: invError } = await adminSupabase
      .from('invitations')
      .select('*')
      .eq('email', credentials.email)
      .single();

    if (invitation) {
      console.log(`✅ Invitation: ${invitation.status}`);
      if (invitation.accepted_at) {
        console.log(`   - Acceptée le: ${invitation.accepted_at}`);
      }
    } else {
      console.log('❌ Invitation non trouvée');
    }

    // 4. Déconnexion
    console.log('\n4️⃣ Déconnexion...');
    await supabase.auth.signOut();
    console.log('✅ Déconnexion effectuée');

    // 5. Résumé
    console.log('\n🎯 RÉSUMÉ:');
    console.log('─────────────────────────────────────');
    if (profile && tenant && employee && userRoles?.length > 0) {
      console.log('🎉 SUCCÈS COMPLET: Tenant owner créé et connexion réussie !');
      console.log('   ✅ Connexion utilisateur');
      console.log('   ✅ Profil créé');
      console.log('   ✅ Tenant créé');
      console.log('   ✅ Employé créé');
      console.log('   ✅ Rôles assignés');
    } else {
      console.log('⚠️ CONNEXION RÉUSSIE mais données incomplètes');
      console.log('   Le trigger doit être exécuté manuellement');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testLoginWithTempPassword();
