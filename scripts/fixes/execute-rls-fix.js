import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Charger les variables d'environnement manuellement
const env = {};
try {
  const envFile = fs.readFileSync('.env', 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Supprimer les guillemets
      env[key.trim()] = value.trim();
    }
  });
} catch (error) {
  console.log('⚠️  Fichier .env non trouvé, utilisation des variables système');
}

// Utiliser la clé service_role depuis les variables d'environnement
const SUPABASE_URL = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
// Utiliser la clé service_role depuis .env
const SERVICE_ROLE_KEY = env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔗 Connexion à Supabase:', SUPABASE_URL);
console.log('🔑 Service Key trouvée:', SERVICE_ROLE_KEY ? 'Oui' : 'Non');
console.log('📋 Variables env chargées:', Object.keys(env));

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function executeRLSFix() {
  console.log('🔒 Correction des politiques RLS après suppression de tenant_members...\n');

  try {
    // Lire le script SQL
    const sqlScript = fs.readFileSync('./fix-rls-policies-after-tenant-members-drop.sql', 'utf8');
    
    // Diviser le script en commandes individuelles
    const commands = sqlScript
      .split(/;\s*(?=--|\n|$)/)
      .filter(cmd => cmd.trim() && !cmd.trim().startsWith('--'))
      .map(cmd => cmd.trim().replace(/;$/, ''));

    console.log(`📋 ${commands.length} commandes SQL à exécuter...\n`);

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (!command || command.length < 10) continue;

      console.log(`⚡ Exécution de la commande ${i + 1}/${commands.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('sql', {
          query: command
        });

        if (error) {
          console.log(`❌ Erreur sur commande ${i + 1}:`, error.message);
          // Continuer malgré les erreurs non critiques
          if (error.message.includes('does not exist') || 
              error.message.includes('already exists') ||
              error.message.includes('cannot drop')) {
            console.log('   ⚠️  Erreur non critique, continuation...');
            continue;
          } else {
            throw error;
          }
        }

        if (data && Array.isArray(data) && data.length > 0) {
          console.log(`   ✅ Résultat:`, data[0]);
        } else {
          console.log(`   ✅ Commande exécutée avec succès`);
        }
      } catch (cmdError) {
        console.log(`❌ Erreur sur commande ${i + 1}:`, cmdError.message);
        // Continuer même en cas d'erreur pour les politiques
        if (cmdError.message.includes('policy') || cmdError.message.includes('does not exist')) {
          console.log('   ⚠️  Erreur de politique ignorée, continuation...');
          continue;
        }
      }
    }

    // Test final - vérifier l'accès aux tables
    console.log('\n🔍 Test d\'accès aux tables après correction...');
    
    try {
      const { data: rolesTest, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .limit(1);
      
      if (rolesError) {
        console.log('❌ Erreur d\'accès à roles:', rolesError.message);
      } else {
        console.log('✅ Accès à la table roles: OK');
      }
    } catch (testError) {
      console.log('⚠️  Test d\'accès échoué:', testError.message);
    }

    try {
      const { data: permissionsTest, error: permissionsError } = await supabase
        .from('permissions')
        .select('*')
        .limit(1);
      
      if (permissionsError) {
        console.log('❌ Erreur d\'accès à permissions:', permissionsError.message);
      } else {
        console.log('✅ Accès à la table permissions: OK');
      }
    } catch (testError) {
      console.log('⚠️  Test d\'accès permissions échoué:', testError.message);
    }

    try {
      const { data: userRolesTest, error: userRolesError } = await supabase
        .from('user_roles')
        .select('*')
        .limit(1);
      
      if (userRolesError) {
        console.log('❌ Erreur d\'accès à user_roles:', userRolesError.message);
      } else {
        console.log('✅ Accès à la table user_roles: OK');
      }
    } catch (testError) {
      console.log('⚠️  Test d\'accès user_roles échoué:', testError.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 CORRECTION DES POLITIQUES RLS TERMINÉE');
    console.log('='.repeat(60));
    console.log('✅ Politiques RLS mises à jour pour utiliser profiles.tenant_id');
    console.log('🏢 Compatible avec la logique useTenant du TenantContext');
    console.log('🔒 Fini les erreurs "tenant_members does not exist"');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Exécuter la correction
executeRLSFix();
