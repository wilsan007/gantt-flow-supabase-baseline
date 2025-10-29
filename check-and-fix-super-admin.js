import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndFixSuperAdmin() {
  console.log('🔍 VÉRIFICATION ET CORRECTION SUPER ADMIN');
  console.log('========================================');
  
  const superAdminId = '5c5731ce-75d0-4455-8184-bc42c626cb17';
  
  try {
    // 1. VÉRIFIER LES RÔLES EXISTANTS
    console.log('\n1️⃣ VÉRIFICATION DES RÔLES...');
    
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*')
      .order('name');
    
    if (rolesError) {
      console.error('❌ Erreur récupération rôles:', rolesError);
      return;
    }
    
    console.log('📋 Rôles disponibles:');
    roles.forEach(role => {
      console.log(`   - ${role.name} (ID: ${role.id})`);
    });
    
    // Chercher le rôle Super Admin
    const superAdminRole = roles.find(r => r.name === 'Super Admin');
    
    if (!superAdminRole) {
      console.log('❌ Rôle "Super Admin" non trouvé');
      
      // Créer le rôle Super Admin
      console.log('🔧 Création du rôle Super Admin...');
      
      const { data: newRole, error: createRoleError } = await supabase
        .from('roles')
        .insert({
          name: 'Super Admin',
          description: 'Accès complet au système',
          permissions: {
            all: true,
            create_tenants: true,
            manage_users: true,
            system_admin: true
          },
          is_system_role: true
        })
        .select()
        .single();
      
      if (createRoleError) {
        console.error('❌ Erreur création rôle:', createRoleError);
        return;
      }
      
      console.log('✅ Rôle Super Admin créé:', newRole.id);
      superAdminRole = newRole;
    } else {
      console.log('✅ Rôle Super Admin trouvé:', superAdminRole.id);
    }
    
    // 2. VÉRIFIER LES ASSIGNATIONS DE RÔLES POUR CET UTILISATEUR
    console.log('\n2️⃣ VÉRIFICATION ASSIGNATIONS UTILISATEUR...');
    
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('*, roles(*)')
      .eq('user_id', superAdminId);
    
    if (userRolesError) {
      console.error('❌ Erreur récupération user_roles:', userRolesError);
      return;
    }
    
    console.log(`📋 Rôles assignés à ${superAdminId}:`);
    if (userRoles.length === 0) {
      console.log('   - Aucun rôle assigné');
    } else {
      userRoles.forEach(ur => {
        console.log(`   - ${ur.roles.name} (Actif: ${ur.is_active})`);
      });
    }
    
    // 3. ASSIGNER LE RÔLE SUPER ADMIN SI NÉCESSAIRE
    const hasSuperAdminRole = userRoles.some(ur => 
      ur.roles.name === 'Super Admin' && ur.is_active
    );
    
    if (!hasSuperAdminRole) {
      console.log('\n3️⃣ ASSIGNATION RÔLE SUPER ADMIN...');
      
      const { data: assignment, error: assignError } = await supabase
        .from('user_roles')
        .insert({
          user_id: superAdminId,
          role_id: superAdminRole.id,
          tenant_id: null, // Super Admin n'est pas lié à un tenant spécifique
          assigned_by: superAdminId, // Auto-assigné
          assigned_at: new Date().toISOString(),
          is_active: true
        })
        .select()
        .single();
      
      if (assignError) {
        console.error('❌ Erreur assignation rôle:', assignError);
        return;
      }
      
      console.log('✅ Rôle Super Admin assigné:', assignment.id);
    } else {
      console.log('✅ Utilisateur a déjà le rôle Super Admin');
    }
    
    // 4. VÉRIFIER LE PROFIL UTILISATEUR
    console.log('\n4️⃣ VÉRIFICATION PROFIL UTILISATEUR...');
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', superAdminId)
      .single();
    
    if (profileError) {
      console.log('⚠️ Profil non trouvé, création...');
      
      const { data: newProfile, error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          user_id: superAdminId,
          full_name: 'Super Admin',
          email: 'osman.awaleh.adn@gmail.com',
          employee_id: 'SA001',
          position: 'Super Administrateur',
          department: 'Système',
          hire_date: new Date().toISOString().split('T')[0],
          status: 'active',
          tenant_id: null // Super Admin n'appartient à aucun tenant
        })
        .select()
        .single();
      
      if (createProfileError) {
        console.error('❌ Erreur création profil:', createProfileError);
      } else {
        console.log('✅ Profil Super Admin créé');
      }
    } else {
      console.log('✅ Profil trouvé:', profile.full_name);
    }
    
    // 5. TEST FINAL
    console.log('\n5️⃣ TEST FINAL is_super_admin...');
    
    const { data: finalTest, error: finalError } = await supabase
      .rpc('is_super_admin', { user_id: superAdminId });
    
    if (finalError) {
      console.error('❌ Erreur test final:', finalError);
    } else {
      console.log('✅ Test is_super_admin:', finalTest);
      
      if (finalTest) {
        console.log('🎉 SUPER ADMIN CONFIGURÉ AVEC SUCCÈS !');
        
        // Maintenant tester l'Edge Function
        console.log('\n6️⃣ TEST EDGE FUNCTION...');
        
        try {
          const response = await fetch(
            `${supabaseUrl}/functions/v1/send-invitation`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: `test-fixed-super-admin-${Date.now()}@example.com`,
                fullName: 'Test Fixed Super Admin',
                invitationType: 'tenant_owner',
                siteUrl: 'http://localhost:8080'
              }),
            }
          );
          
          if (response.ok) {
            const result = await response.json();
            console.log('✅ Edge Function SUCCESS:', result);
            
            // Nettoyer
            if (result.invitation_id) {
              await supabase.from('invitations').delete().eq('id', result.invitation_id);
              console.log('🧹 Invitation de test nettoyée');
            }
          } else {
            const error = await response.text();
            console.error('❌ Edge Function FAILED:', error);
          }
        } catch (err) {
          console.error('❌ Exception Edge Function:', err.message);
        }
      } else {
        console.log('❌ Super Admin toujours non reconnu');
      }
    }
    
  } catch (error) {
    console.error('💥 Erreur générale:', error);
  }
}

checkAndFixSuperAdmin();
