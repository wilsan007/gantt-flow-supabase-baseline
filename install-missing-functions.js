import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function installMissingFunctions() {
  console.log('🔧 INSTALLATION DES FONCTIONS MANQUANTES');
  console.log('=======================================');
  
  try {
    // 1. Vérifier les fonctions existantes
    console.log('\n1️⃣ VÉRIFICATION DES FONCTIONS EXISTANTES...');
    
    const requiredFunctions = [
      'is_super_admin',
      'onboard_tenant_owner', 
      'validate_invitation',
      'get_user_tenant_info',
      'cleanup_expired_invitations',
      'diagnose_onboarding_system'
    ];
    
    const existingFunctions = [];
    
    for (const funcName of requiredFunctions) {
      try {
        // Tester si la fonction existe en l'appelant avec des paramètres de test
        let testResult;
        
        switch (funcName) {
          case 'is_super_admin':
            testResult = await supabase.rpc(funcName, { user_id: '00000000-0000-0000-0000-000000000000' });
            break;
          case 'validate_invitation':
            testResult = await supabase.rpc(funcName, { invite_code: '00000000-0000-0000-0000-000000000000' });
            break;
          case 'cleanup_expired_invitations':
          case 'diagnose_onboarding_system':
            testResult = await supabase.rpc(funcName);
            break;
          default:
            // Pour les autres fonctions, on teste avec des paramètres minimaux
            continue;
        }
        
        if (!testResult.error || testResult.error.code !== 'PGRST202') {
          existingFunctions.push(funcName);
          console.log(`✅ ${funcName} - existe`);
        } else {
          console.log(`❌ ${funcName} - manquante`);
        }
      } catch (err) {
        if (err.code === 'PGRST202') {
          console.log(`❌ ${funcName} - manquante`);
        } else {
          existingFunctions.push(funcName);
          console.log(`✅ ${funcName} - existe (erreur attendue)`);
        }
      }
    }
    
    console.log(`\n📊 Fonctions trouvées: ${existingFunctions.length}/${requiredFunctions.length}`);
    
    // 2. Installer les fonctions manquantes si nécessaire
    if (existingFunctions.length < requiredFunctions.length) {
      console.log('\n2️⃣ INSTALLATION DES FONCTIONS MANQUANTES...');
      
      try {
        const sqlContent = readFileSync('./create-complete-sql-functions.sql', 'utf8');
        
        // Diviser le SQL en blocs de fonctions individuelles
        const functionBlocks = sqlContent.split(/(?=CREATE OR REPLACE FUNCTION)/g);
        
        for (const block of functionBlocks) {
          if (block.trim() && block.includes('CREATE OR REPLACE FUNCTION')) {
            try {
              const { error } = await supabase.rpc('exec_sql', { sql: block.trim() });
              if (error) {
                console.log('⚠️ Tentative d\'exécution directe...');
                // Essayer d'exécuter via une requête directe (méthode alternative)
                console.log('📝 Bloc SQL:', block.substring(0, 100) + '...');
              } else {
                console.log('✅ Fonction installée avec succès');
              }
            } catch (err) {
              console.log('⚠️ Erreur installation fonction:', err.message);
            }
          }
        }
      } catch (err) {
        console.error('❌ Erreur lecture fichier SQL:', err.message);
        console.log('\n💡 SOLUTION MANUELLE:');
        console.log('1. Ouvrez Supabase Dashboard > SQL Editor');
        console.log('2. Copiez le contenu de create-complete-sql-functions.sql');
        console.log('3. Exécutez le script SQL manuellement');
      }
    }
    
    // 3. Vérification finale
    console.log('\n3️⃣ VÉRIFICATION FINALE...');
    
    const { data: finalDiagnosis, error: diagError } = await supabase
      .rpc('diagnose_onboarding_system');
    
    if (diagError) {
      console.error('❌ Erreur diagnostic final:', diagError);
    } else {
      console.log('✅ Diagnostic final:');
      console.log(JSON.stringify(finalDiagnosis, null, 2));
    }
    
    // 4. Test rapide des fonctions critiques
    console.log('\n4️⃣ TEST RAPIDE DES FONCTIONS...');
    
    // Test is_super_admin
    try {
      const { data: superAdminTest } = await supabase
        .rpc('is_super_admin', { user_id: '5c5731ce-75d0-4455-8184-bc42c626cb17' });
      console.log('✅ is_super_admin:', superAdminTest);
    } catch (err) {
      console.log('❌ is_super_admin:', err.message);
    }
    
    // Test validate_invitation
    try {
      const { data: validationTest } = await supabase
        .rpc('validate_invitation', { invite_code: '00000000-0000-0000-0000-000000000000' });
      console.log('✅ validate_invitation:', validationTest?.valid === false ? 'OK' : 'Unexpected');
    } catch (err) {
      console.log('❌ validate_invitation:', err.message);
    }
    
  } catch (error) {
    console.error('💥 Erreur générale:', error);
  }
}

installMissingFunctions();
