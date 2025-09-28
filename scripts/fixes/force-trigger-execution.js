import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function forceTriggerExecution() {
  console.log('🔧 FORCER L\'EXÉCUTION DU TRIGGER');
  console.log('================================\n');

  const realUserEmail = 'test234@yahoo.com';
  const realUserId = '0e2f0742-02f8-44e6-9ef3-775e78f71e2f';

  try {
    // ============================================
    // ÉTAPE 1: VÉRIFIER SI LE TRIGGER EXISTE
    // ============================================
    console.log('🔍 1. Vérification de l\'existence du trigger...');
    
    const { data: triggerExists, error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT tgname, tgenabled 
        FROM pg_trigger 
        WHERE tgname = 'auto_tenant_creation_trigger';
      `
    });

    if (triggerError) {
      console.log('   ⚠️ Impossible de vérifier le trigger via RPC');
      console.log('   💡 Le trigger doit être déployé via Supabase Dashboard');
    } else if (triggerExists && triggerExists.length > 0) {
      console.log('   ✅ Trigger trouvé:', triggerExists[0]);
    } else {
      console.log('   ❌ Trigger non trouvé dans la base');
    }

    // ============================================
    // ÉTAPE 2: VÉRIFIER LES FONCTIONS
    // ============================================
    console.log('\n🔍 2. Vérification des fonctions...');
    
    const { data: functions, error: funcError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT proname, prosecdef 
        FROM pg_proc 
        WHERE proname IN ('auto_create_tenant_owner', 'generate_unique_employee_id');
      `
    });

    if (funcError) {
      console.log('   ⚠️ Impossible de vérifier les fonctions via RPC');
    } else if (functions && functions.length > 0) {
      console.log('   ✅ Fonctions trouvées:');
      functions.forEach(func => {
        console.log(`      - ${func.proname} (SECURITY DEFINER: ${func.prosecdef})`);
      });
    } else {
      console.log('   ❌ Fonctions non trouvées');
    }

    // ============================================
    // ÉTAPE 3: FORCER L'EXÉCUTION MANUELLE
    // ============================================
    console.log('\n🚀 3. Exécution manuelle de la fonction...');
    
    try {
      // Simuler l'exécution du trigger avec les données de l'utilisateur
      const { data: manualResult, error: manualError } = await supabase.rpc('exec_sql', {
        sql: `
          DO $$
          DECLARE
              user_record auth.users%ROWTYPE;
          BEGIN
              -- Récupérer l'utilisateur
              SELECT * INTO user_record 
              FROM auth.users 
              WHERE id = '${realUserId}';
              
              -- Appeler la fonction directement
              PERFORM auto_create_tenant_owner_direct(user_record);
              
              RAISE NOTICE 'Fonction exécutée manuellement pour user %', user_record.email;
          END $$;
        `
      });

      if (manualError) {
        console.log('   ❌ Erreur exécution manuelle:', manualError.message);
        
        // Essayer avec une approche plus simple
        console.log('   🔄 Tentative avec approche simplifiée...');
        
        const { data: simpleResult, error: simpleError } = await supabase.rpc('repair_existing_tenant_owner', {
          p_user_email: realUserEmail
        });

        if (simpleError) {
          console.log('   ❌ Erreur fonction repair:', simpleError.message);
        } else {
          console.log('   ✅ Résultat repair:', simpleResult);
        }
      } else {
        console.log('   ✅ Exécution manuelle réussie');
      }
    } catch (error) {
      console.log('   ❌ Exception:', error.message);
    }

    // ============================================
    // ÉTAPE 4: CRÉER MANUELLEMENT ÉTAPE PAR ÉTAPE
    // ============================================
    console.log('\n🛠️ 4. Création manuelle étape par étape...');
    
    const tenantId = 'f935127c-e1b5-46a8-955d-23212b3acd08';
    const userId = realUserId;
    
    // Étape 1: Créer le tenant
    console.log('   1️⃣ Création tenant...');
    const { error: tenantError } = await supabase
      .from('tenants')
      .upsert({
        id: tenantId,
        name: 'Med Osman Company',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (tenantError) {
      console.log('      ❌ Erreur tenant:', tenantError.message);
    } else {
      console.log('      ✅ Tenant créé/mis à jour');
    }

    // Étape 2: Récupérer le rôle tenant_admin
    console.log('   2️⃣ Récupération rôle tenant_admin...');
    const { data: tenantAdminRole, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'tenant_admin')
      .single();

    if (roleError) {
      console.log('      ❌ Erreur rôle:', roleError.message);
      return;
    } else {
      console.log('      ✅ Rôle trouvé:', tenantAdminRole.id);
    }

    // Étape 3: Assigner le rôle
    console.log('   3️⃣ Attribution rôle...');
    const { error: userRoleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role_id: tenantAdminRole.id,
        tenant_id: tenantId,
        is_active: true,
        created_at: new Date().toISOString()
      });

    if (userRoleError) {
      console.log('      ❌ Erreur user_role:', userRoleError.message);
    } else {
      console.log('      ✅ Rôle assigné');
    }

    // Étape 4: Créer le profil
    console.log('   4️⃣ Création profil...');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        tenant_id: tenantId,
        full_name: 'Med Osman',
        email: realUserEmail,
        role: 'tenant_admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.log('      ❌ Erreur profil:', profileError.message);
    } else {
      console.log('      ✅ Profil créé');
    }

    // Étape 5: Générer employee_id unique
    console.log('   5️⃣ Génération employee_id...');
    const { data: existingEmployees } = await supabase
      .from('employees')
      .select('employee_id')
      .eq('tenant_id', tenantId)
      .like('employee_id', 'EMP%');

    let maxNumber = 0;
    if (existingEmployees) {
      existingEmployees.forEach(emp => {
        const match = emp.employee_id.match(/^EMP(\d+)$/);
        if (match) {
          maxNumber = Math.max(maxNumber, parseInt(match[1]));
        }
      });
    }
    
    const newEmployeeId = 'EMP' + String(maxNumber + 1).padStart(6, '0');
    console.log('      📋 Employee ID généré:', newEmployeeId);

    // Étape 6: Créer l'employé
    console.log('   6️⃣ Création employé...');
    const { error: employeeError } = await supabase
      .from('employees')
      .upsert({
        user_id: userId,
        employee_id: newEmployeeId,
        full_name: 'Med Osman',
        email: realUserEmail,
        job_title: 'Directeur Général',
        hire_date: new Date().toISOString().split('T')[0],
        contract_type: 'CDI',
        status: 'active',
        tenant_id: tenantId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (employeeError) {
      console.log('      ❌ Erreur employé:', employeeError.message);
    } else {
      console.log('      ✅ Employé créé');
    }

    // Étape 7: Marquer l'invitation comme acceptée
    console.log('   7️⃣ Mise à jour invitation...');
    const { error: invitationError } = await supabase
      .from('invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        metadata: {
          temp_password: 'hxwesr2m1C3M1!',
          confirmation_url: 'https://qliinxtanjdnwxlvnxji.supabase.co/auth/v1/verify?token=05951983257eb280007355e5aa647a9f0b76abddbb98bcfa14fbe79a&type=signup&redirect_to=http://localhost:8080/tenant-signup',
          supabase_user_id: userId,
          completed_by: userId,
          tenant_created: tenantId,
          completion_date: new Date().toISOString()
        }
      })
      .eq('email', realUserEmail)
      .eq('invitation_type', 'tenant_owner');

    if (invitationError) {
      console.log('      ❌ Erreur invitation:', invitationError.message);
    } else {
      console.log('      ✅ Invitation mise à jour');
    }

    // ============================================
    // ÉTAPE 5: VÉRIFICATION FINALE
    // ============================================
    console.log('\n📊 5. Vérification finale...');
    
    const checkFinal = async (table, condition, label) => {
      const { data, error } = await supabase.from(table).select('*').match(condition);
      if (error) {
        console.log(`   ❌ ${label}: ${error.message}`);
        return false;
      }
      console.log(`   ✅ ${label}: ${data?.length || 0} enregistrement(s)`);
      return data && data.length > 0;
    };

    const tenantOk = await checkFinal('tenants', { id: tenantId }, 'Tenant');
    const profileOk = await checkFinal('profiles', { user_id: userId }, 'Profile');
    const userRoleOk = await checkFinal('user_roles', { user_id: userId }, 'User Role');
    const employeeOk = await checkFinal('employees', { user_id: userId }, 'Employee');

    console.log('\n🎯 RÉSULTAT FINAL:');
    if (tenantOk && profileOk && userRoleOk && employeeOk) {
      console.log('🎉 SUCCÈS: Tenant owner créé manuellement !');
    } else {
      console.log('❌ ÉCHEC: Création incomplète');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

forceTriggerExecution();
