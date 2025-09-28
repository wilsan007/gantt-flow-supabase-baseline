// Script pour configurer l'utilisateur comme admin tenant
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qliinxtanjdnwxlvnxji.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg2MTMsImV4cCI6MjA3Mjc0NDYxM30.13wLfMNJ2Joxpw9GWq2_ymJgPtQizZZUzRUDNVRhQzM";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const USER_ID = "ebb4c3fe-6288-41df-972d-4a6f32ed813d";
const USER_EMAIL = "zdouce.zz@gmail.com";
const TENANT_ID = "878c5ac9-4e99-4baf-803a-14f8ac964ec4";

async function setupAdminUser() {
  try {
    console.log('🔧 Configuration de l\'utilisateur admin...');
    console.log('👤 User ID:', USER_ID);
    console.log('🏢 Tenant ID:', TENANT_ID);
    
    // Étape 1: Se connecter avec l'utilisateur
    console.log('\n1️⃣ Connexion de l\'utilisateur...');
    // Note: Nous allons utiliser les API publiques sans authentification pour la configuration initiale
    console.log('ℹ️ Configuration via API publique (pas besoin de mot de passe)');
    
    // Étape 2: Créer/Mettre à jour le profil dans la table profiles
    console.log('\n2️⃣ Configuration du profil utilisateur...');
    
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', USER_ID)
      .single();
    
    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.log('❌ Erreur vérification profil:', profileCheckError.message);
    }
    
    if (existingProfile) {
      console.log('✅ Profil existant trouvé, mise à jour...');
      
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          tenant_id: TENANT_ID,
          role: 'admin',
          job_title: 'Administrateur Système',
          full_name: 'Administrateur Wadashaqeen'
        })
        .eq('user_id', USER_ID)
        .select()
        .single();
      
      if (updateError) {
        console.log('❌ Erreur mise à jour profil:', updateError.message);
      } else {
        console.log('✅ Profil mis à jour');
      }
    } else {
      console.log('📝 Création d\'un nouveau profil...');
      
      const { data: newProfile, error: createProfileError } = await supabase
        .from('profiles')
        .insert([{
          user_id: USER_ID,
          tenant_id: TENANT_ID,
          full_name: 'Administrateur Wadashaqeen',
          role: 'admin',
          job_title: 'Administrateur Système',
          employee_id: 'ADM001',
          hire_date: new Date().toISOString().split('T')[0],
          contract_type: 'CDI',
          weekly_hours: 40
        }])
        .select()
        .single();
      
      if (createProfileError) {
        console.log('❌ Erreur création profil:', createProfileError.message);
      } else {
        console.log('✅ Nouveau profil créé');
      }
    }
    
    // Étape 3: Créer/Mettre à jour l'entrée tenant_members
    console.log('\n3️⃣ Configuration des membres du tenant...');
    
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('tenant_members')
      .select('*')
      .eq('user_id', USER_ID)
      .eq('tenant_id', TENANT_ID)
      .single();
    
    if (memberCheckError && memberCheckError.code !== 'PGRST116') {
      console.log('❌ Erreur vérification membre:', memberCheckError.message);
    }
    
    if (existingMember) {
      console.log('✅ Membre existant trouvé, mise à jour...');
      
      const { data: updatedMember, error: updateMemberError } = await supabase
        .from('tenant_members')
        .update({
          role: 'admin',
          status: 'active',
          joined_at: new Date().toISOString(),
          permissions: {
            "admin": true,
            "manage_users": true,
            "manage_projects": true,
            "manage_tasks": true,
            "manage_hr": true,
            "view_analytics": true,
            "manage_settings": true
          }
        })
        .eq('user_id', USER_ID)
        .eq('tenant_id', TENANT_ID)
        .select()
        .single();
      
      if (updateMemberError) {
        console.log('❌ Erreur mise à jour membre:', updateMemberError.message);
      } else {
        console.log('✅ Membre mis à jour avec permissions admin');
      }
    } else {
      console.log('📝 Ajout comme nouveau membre du tenant...');
      
      const { data: newMember, error: createMemberError } = await supabase
        .from('tenant_members')
        .insert([{
          user_id: USER_ID,
          tenant_id: TENANT_ID,
          role: 'admin',
          status: 'active',
          joined_at: new Date().toISOString(),
          permissions: {
            "admin": true,
            "manage_users": true,
            "manage_projects": true,
            "manage_tasks": true,
            "manage_hr": true,
            "view_analytics": true,
            "manage_settings": true
          }
        }])
        .select()
        .single();
      
      if (createMemberError) {
        console.log('❌ Erreur création membre:', createMemberError.message);
      } else {
        console.log('✅ Nouveau membre créé avec permissions admin');
      }
    }
    
    // Étape 4: Créer/Mettre à jour l'entrée employees
    console.log('\n4️⃣ Configuration de l\'employé...');
    
    const { data: existingEmployee, error: employeeCheckError } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', USER_ID)
      .single();
    
    if (employeeCheckError && employeeCheckError.code !== 'PGRST116') {
      console.log('❌ Erreur vérification employé:', employeeCheckError.message);
    }
    
    if (existingEmployee) {
      console.log('✅ Employé existant trouvé, mise à jour...');
      
      const { data: updatedEmployee, error: updateEmployeeError } = await supabase
        .from('employees')
        .update({
          tenant_id: TENANT_ID,
          status: 'active'
        })
        .eq('user_id', USER_ID)
        .select()
        .single();
      
      if (updateEmployeeError) {
        console.log('❌ Erreur mise à jour employé:', updateEmployeeError.message);
      } else {
        console.log('✅ Employé mis à jour');
      }
    } else {
      console.log('📝 Création d\'un nouvel employé...');
      
      const { data: newEmployee, error: createEmployeeError } = await supabase
        .from('employees')
        .insert([{
          user_id: USER_ID,
          tenant_id: TENANT_ID,
          email: USER_EMAIL,
          full_name: 'Administrateur Wadashaqeen',
          employee_id: 'ADM001',
          job_title: 'Administrateur Système',
          hire_date: new Date().toISOString().split('T')[0],
          contract_type: 'CDI',
          status: 'active',
          weekly_hours: 40
        }])
        .select()
        .single();
      
      if (createEmployeeError) {
        console.log('❌ Erreur création employé:', createEmployeeError.message);
      } else {
        console.log('✅ Nouvel employé créé');
      }
    }
    
    // Étape 5: Vérification finale
    console.log('\n5️⃣ Vérification finale...');
    
    const { data: finalProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', USER_ID)
      .single();
    
    const { data: finalMember } = await supabase
      .from('tenant_members')
      .select('*')
      .eq('user_id', USER_ID)
      .eq('tenant_id', TENANT_ID)
      .single();
    
    const { data: finalEmployee } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', USER_ID)
      .single();
    
    console.log('\n📊 Résumé de la configuration:');
    console.log('👤 Profil:', finalProfile ? '✅ Configuré' : '❌ Manquant');
    console.log('🏢 Membre tenant:', finalMember ? '✅ Configuré' : '❌ Manquant');
    console.log('👥 Employé:', finalEmployee ? '✅ Configuré' : '❌ Manquant');
    
    if (finalProfile && finalMember) {
      console.log('\n🎉 Configuration admin terminée avec succès!');
      console.log('🔐 L\'utilisateur peut maintenant accéder aux données du tenant');
    } else {
      console.log('\n⚠️ Configuration incomplète, vérifiez les erreurs ci-dessus');
    }
    
    return true;
    
  } catch (err) {
    console.error('💥 Erreur critique:', err.message);
    return false;
  }
}

setupAdminUser().then(success => {
  if (success) {
    console.log('\n✅ Script terminé');
  } else {
    console.log('\n❌ Script échoué');
  }
  process.exit(success ? 0 : 1);
});
