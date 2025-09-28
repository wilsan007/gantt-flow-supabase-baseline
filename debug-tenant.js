const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const USER_ID = 'ebb4c3fe-6288-41df-972d-4a6f32ed813d';
const TENANT_ID = '878c5ac9-4e99-4baf-803a-14f8ac964ec4';

async function debugTenantRetrieval() {
  console.log('🔍 Debug: Récupération du tenant utilisateur');
  console.log('👤 User ID:', USER_ID);
  console.log('🏢 Expected Tenant ID:', TENANT_ID);
  
  try {
    // Test 1: Vérifier les données du profil
    console.log('\n1️⃣ Test: Récupération du profil utilisateur');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', USER_ID)
      .single();
    
    console.log('Profile data:', profile);
    console.log('Profile error:', profileError);
    
    if (profile) {
      console.log('✅ Profil trouvé');
      console.log('🏢 Tenant ID dans profil:', profile.tenant_id);
      console.log('👤 Role:', profile.role);
      console.log('📝 Full name:', profile.full_name);
    }
    
    // Test 2: Vérifier si le tenant existe
    console.log('\n2️⃣ Test: Vérification de l\'existence du tenant');
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', TENANT_ID)
      .single();
    
    console.log('Tenant data:', tenant);
    console.log('Tenant error:', tenantError);
    
    if (tenant) {
      console.log('✅ Tenant trouvé');
      console.log('🏢 Nom:', tenant.name);
      console.log('📊 Status:', tenant.status);
    }
    
    // Test 3: Jointure profiles -> tenants (comme dans useTenant)
    console.log('\n3️⃣ Test: Jointure profiles -> tenants');
    const { data: profileWithTenant, error: joinError } = await supabase
      .from('profiles')
      .select('*, tenant:tenants(*)')
      .eq('user_id', USER_ID)
      .single();
    
    console.log('Profile with tenant data:', profileWithTenant);
    console.log('Join error:', joinError);
    
    if (profileWithTenant) {
      console.log('✅ Jointure réussie');
      console.log('🏢 Tenant dans jointure:', profileWithTenant.tenant);
      
      if (profileWithTenant.tenant) {
        console.log('✅ Données tenant récupérées');
        console.log('🏢 Tenant name:', profileWithTenant.tenant.name);
        console.log('🏢 Tenant id:', profileWithTenant.tenant.id);
      } else {
        console.log('❌ Pas de données tenant dans la jointure');
      }
    }
    
    // Test 4: Vérifier les politiques RLS sur profiles
    console.log('\n4️⃣ Test: Vérification des politiques RLS');
    
    // Simuler une authentification (si possible)
    const { data: authUser, error: authError } = await supabase.auth.getUser();
    console.log('Auth user:', authUser?.user?.id);
    console.log('Auth error:', authError);
    
    if (authUser?.user?.id === USER_ID) {
      console.log('✅ Utilisateur authentifié correspond');
    } else {
      console.log('⚠️ Utilisateur authentifié différent ou non connecté');
    }
    
    // Test 5: Vérifier tenant_members (pour comparaison)
    console.log('\n5️⃣ Test: Vérification tenant_members');
    const { data: membership, error: membershipError } = await supabase
      .from('tenant_members')
      .select('*')
      .eq('user_id', USER_ID)
      .eq('tenant_id', TENANT_ID);
    
    console.log('Membership data:', membership);
    console.log('Membership error:', membershipError);
    
  } catch (error) {
    console.error('❌ Erreur globale:', error);
  }
}

debugTenantRetrieval();
