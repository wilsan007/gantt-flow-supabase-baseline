#!/usr/bin/env node

/**
 * Script de diagnostic pour l'erreur 500 de l'Edge Function send-invitation
 * Vérifie les prérequis et teste les composants individuellement
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration directe des variables
const supabaseUrl = "https://qliinxtanjdnwxlvnxji.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI";

// Client avec privilèges service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const SUPER_ADMIN_ID = '5c5731ce-75d0-4455-8184-bc42c626cb17';

async function debugEdgeFunctionError() {
  console.log('🔍 DIAGNOSTIC ERREUR EDGE FUNCTION send-invitation');
  console.log('⏰ Début:', new Date().toISOString());
  console.log('=' .repeat(80));

  try {
    // 1. Vérifier la fonction is_super_admin
    console.log('\n🔧 ÉTAPE 1: Vérification fonction is_super_admin...');
    
    try {
      const { data: isSuperAdmin, error: roleError } = await supabase
        .rpc('is_super_admin', { user_id: SUPER_ADMIN_ID });

      if (roleError) {
        console.log('❌ Erreur fonction is_super_admin:', roleError.message);
        console.log('   Code:', roleError.code);
        console.log('   Détails:', roleError.details);
        console.log('   🚨 CAUSE PROBABLE: Fonction is_super_admin manquante ou mal configurée');
      } else {
        console.log('✅ Fonction is_super_admin existe');
        console.log('   Résultat pour Super Admin:', isSuperAdmin);
        if (!isSuperAdmin) {
          console.log('⚠️  Super Admin non reconnu - vérifier les rôles');
        }
      }
    } catch (error) {
      console.log('❌ Exception fonction is_super_admin:', error.message);
    }

    // 2. Vérifier les rôles du Super Admin
    console.log('\n👤 ÉTAPE 2: Vérification rôles Super Admin...');
    
    const { data: userRoles, error: userRoleError } = await supabase
      .from('user_roles')
      .select(`
        *,
        roles (
          id,
          name,
          description
        )
      `)
      .eq('user_id', SUPER_ADMIN_ID);

    if (userRoleError) {
      console.log('❌ Erreur lecture user_roles:', userRoleError.message);
    } else {
      console.log('✅ Rôles trouvés:', userRoles.length);
      userRoles.forEach(role => {
        console.log(`   - ${role.roles.name} (${role.is_active ? 'actif' : 'inactif'})`);
      });
      
      const hasSuperAdmin = userRoles.some(r => r.roles.name === 'super_admin' && r.is_active);
      if (!hasSuperAdmin) {
        console.log('⚠️  Aucun rôle super_admin actif trouvé');
      }
    }

    // 3. Vérifier l'utilisateur auth
    console.log('\n🔐 ÉTAPE 3: Vérification utilisateur auth...');
    
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(SUPER_ADMIN_ID);
    
    if (authError) {
      console.log('❌ Erreur utilisateur auth:', authError.message);
    } else {
      console.log('✅ Utilisateur auth trouvé');
      console.log('   Email:', authUser.user.email);
      console.log('   Confirmé:', authUser.user.email_confirmed_at ? 'Oui' : 'Non');
      console.log('   Créé:', authUser.user.created_at);
    }

    // 4. Tester création utilisateur temporaire
    console.log('\n👥 ÉTAPE 4: Test création utilisateur temporaire...');
    
    const testEmail = 'test-edge-function@example.com';
    const tempPassword = 'TestPass123!';
    
    try {
      // Supprimer l'utilisateur test s'il existe
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === testEmail);
      
      if (existingUser) {
        console.log('   Suppression utilisateur test existant...');
        await supabase.auth.admin.deleteUser(existingUser.id);
      }

      // Créer nouvel utilisateur test
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: tempPassword,
        email_confirm: false,
        user_metadata: {
          full_name: 'Test User',
          temp_user: true
        }
      });

      if (createError) {
        console.log('❌ Erreur création utilisateur test:', createError.message);
        console.log('   🚨 CAUSE PROBABLE: Problème avec Supabase Auth Admin API');
      } else {
        console.log('✅ Utilisateur test créé:', newUser.user.id);
        
        // Nettoyer
        await supabase.auth.admin.deleteUser(newUser.user.id);
        console.log('✅ Utilisateur test supprimé');
      }
    } catch (error) {
      console.log('❌ Exception création utilisateur:', error.message);
    }

    // 5. Tester génération de lien
    console.log('\n🔗 ÉTAPE 5: Test génération lien auth...');
    
    try {
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'signup',
        email: 'test-link@example.com',
        password: 'TestPass123!',
        options: {
          redirectTo: 'http://localhost:8080/tenant-signup'
        }
      });

      if (linkError) {
        console.log('❌ Erreur génération lien:', linkError.message);
        console.log('   🚨 CAUSE PROBABLE: Configuration auth ou permissions insuffisantes');
      } else {
        console.log('✅ Lien généré avec succès');
        console.log('   URL:', linkData.properties.action_link.substring(0, 100) + '...');
        
        // Extraire token
        const url = new URL(linkData.properties.action_link);
        const token = url.searchParams.get('token');
        console.log('   Token extrait:', token ? 'Oui' : 'Non');
      }
    } catch (error) {
      console.log('❌ Exception génération lien:', error.message);
    }

    // 6. Vérifier les variables d'environnement Edge Function
    console.log('\n⚙️  ÉTAPE 6: Variables d\'environnement Edge Function...');
    console.log('   SUPABASE_URL: Configuré dans Edge Function');
    console.log('   SUPABASE_SERVICE_ROLE_KEY: Configuré dans Edge Function');
    console.log('   RESEND_API_KEY: À vérifier dans Supabase Dashboard > Edge Functions > Settings');

    // 7. Recommandations
    console.log('\n💡 RECOMMANDATIONS POUR CORRIGER L\'ERREUR 500:');
    console.log('   1. Exécuter create-is-super-admin-function.sql dans Supabase Dashboard');
    console.log('   2. Vérifier les variables d\'environnement dans Edge Functions Settings');
    console.log('   3. Vérifier que RESEND_API_KEY est configuré');
    console.log('   4. Redéployer l\'Edge Function si nécessaire');

  } catch (error) {
    console.error('💥 ERREUR GÉNÉRALE:', error);
  }

  console.log('\n' + '=' .repeat(80));
  console.log('⏰ Fin:', new Date().toISOString());
}

// Exécution
debugEdgeFunctionError()
  .then(() => {
    console.log('🏁 Diagnostic terminé');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
