import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createSuperAdmin() {
  try {
    console.log('🚀 Création du Super Admin...');

    // 1. Créer l'utilisateur dans auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@wadashaqeen.com',
      password: 'SuperAdmin2024!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Super Administrateur',
        role: 'super_admin'
      }
    });

    if (authError) {
      console.error('❌ Erreur création utilisateur auth:', authError);
      return;
    }

    console.log('✅ Utilisateur auth créé:', authUser.user.id);

    // 2. Utiliser la fonction SQL pour créer le Super Admin
    const { data, error } = await supabase.rpc('create_super_admin', {
      admin_user_id: authUser.user.id,
      admin_full_name: 'Super Administrateur',
      admin_email: 'admin@wadashaqeen.com'
    });

    if (error) {
      console.error('❌ Erreur création Super Admin:', error);
      return;
    }

    console.log('✅ Super Admin créé avec succès!');

    // 3. Vérifier la création
    const { data: verification, error: verifyError } = await supabase
      .from('profiles')
      .select(`
        user_id,
        full_name,
        email,
        tenant_id,
        user_roles (
          role_id,
          is_active,
          roles (name)
        )
      `)
      .eq('user_id', authUser.user.id)
      .single();

    if (verifyError) {
      console.error('❌ Erreur vérification:', verifyError);
      return;
    }

    console.log('🔍 Vérification Super Admin:');
    console.log('- User ID:', verification.user_id);
    console.log('- Nom:', verification.full_name);
    console.log('- Email:', verification.email);
    console.log('- Tenant ID:', verification.tenant_id || 'NULL (correct pour Super Admin)');
    console.log('- Rôle:', verification.user_roles[0]?.roles?.name);
    console.log('- Actif:', verification.user_roles[0]?.is_active);

    console.log('\n🎉 Super Admin créé avec succès!');
    console.log('📧 Email: admin@wadashaqeen.com');
    console.log('🔑 Mot de passe: SuperAdmin2024!');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

createSuperAdmin();
