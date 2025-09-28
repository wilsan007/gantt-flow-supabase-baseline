import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifySuperAdmin() {
  console.log('🔍 VÉRIFICATION SUPER ADMIN');
  console.log('==========================');
  
  try {
    const superAdminId = '5c5731ce-75d0-4455-8184-bc42c626cb17';
    
    // 1. Vérifier l'utilisateur dans auth.users
    console.log('\n1️⃣ Vérification auth.users...');
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(superAdminId);
    
    if (authError) {
      console.error('❌ Erreur auth:', authError);
      return;
    }
    
    console.log('✅ Utilisateur trouvé:', authUser.user.email);
    console.log('   Email confirmé:', authUser.user.email_confirmed_at ? 'OUI' : 'NON');
    
    // 2. Vérifier le profil
    console.log('\n2️⃣ Vérification profil...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', superAdminId)
      .single();
    
    if (profileError) {
      console.error('❌ Erreur profil:', profileError);
    } else {
      console.log('✅ Profil trouvé:', profile.full_name);
      console.log('   Role:', profile.role);
      console.log('   Tenant ID:', profile.tenant_id);
    }
    
    // 3. Vérifier les rôles
    console.log('\n3️⃣ Vérification rôles...');
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        *,
        roles(name)
      `)
      .eq('user_id', superAdminId)
      .eq('is_active', true);
    
    if (rolesError) {
      console.error('❌ Erreur rôles:', rolesError);
    } else {
      console.log('✅ Rôles actifs:', userRoles.length);
      userRoles.forEach(role => {
        console.log(`   - ${role.roles.name} (tenant: ${role.tenant_id})`);
      });
    }
    
    // 4. Tester la fonction is_super_admin
    console.log('\n4️⃣ Test fonction is_super_admin...');
    const { data: isSuperAdmin, error: functionError } = await supabase
      .rpc('is_super_admin', { user_id: superAdminId });
    
    if (functionError) {
      console.error('❌ Erreur fonction:', functionError);
    } else {
      console.log('✅ is_super_admin():', isSuperAdmin ? 'TRUE' : 'FALSE');
    }
    
    console.log('\n🎯 RÉSUMÉ :');
    console.log('==========');
    console.log('Email:', authUser.user.email);
    console.log('Mot de passe: Adnadmin@@');
    console.log('Statut Super Admin:', isSuperAdmin ? '✅ ACTIF' : '❌ INACTIF');
    console.log('Prêt pour connexion:', authUser.user.email_confirmed_at ? '✅ OUI' : '❌ NON');
    
  } catch (err) {
    console.error('💥 Erreur:', err);
  }
}

verifySuperAdmin();
