import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes!');
  console.error('Vérifiez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deployMigration230() {
  console.log('');
  console.log('═'.repeat(80));
  console.log('🚀 DÉPLOIEMENT MIGRATION 230');
  console.log('═'.repeat(80));
  console.log('');

  try {
    // Lire le fichier de migration
    const migrationPath = join(__dirname, 'supabase', 'migrations', '20250111000230_fix_user_roles_duplicates_and_trigger.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Fichier de migration chargé');
    console.log(`   Taille: ${(migrationSQL.length / 1024).toFixed(2)} KB`);
    console.log('');

    // Statistiques AVANT
    console.log('📊 STATISTIQUES AVANT MIGRATION:');
    const { count: beforeCount } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true });
    
    const { data: beforeUsers } = await supabase
      .from('user_roles')
      .select('user_id');
    
    const uniqueUsersBefore = [...new Set(beforeUsers?.map(u => u.user_id) || [])].length;
    
    console.log(`   Total lignes: ${beforeCount}`);
    console.log(`   Utilisateurs uniques: ${uniqueUsersBefore}`);
    console.log(`   Moyenne: ${(beforeCount / uniqueUsersBefore).toFixed(2)} rôles/utilisateur`);
    console.log('');

    // Exécuter la migration
    console.log('⚙️  EXÉCUTION DE LA MIGRATION...');
    console.log('');

    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });

    if (error) {
      // Si la fonction exec_sql n'existe pas, essayer directement
      console.log('   ℹ️  Tentative d\'exécution directe...');
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        },
        body: JSON.stringify({ query: migrationSQL })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
      }
    }

    console.log('✅ Migration exécutée avec succès!');
    console.log('');

    // Statistiques APRÈS
    console.log('📊 STATISTIQUES APRÈS MIGRATION:');
    const { count: afterCount } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true });
    
    const { data: afterUsers } = await supabase
      .from('user_roles')
      .select('user_id');
    
    const uniqueUsersAfter = [...new Set(afterUsers?.map(u => u.user_id) || [])].length;
    
    console.log(`   Total lignes: ${afterCount}`);
    console.log(`   Utilisateurs uniques: ${uniqueUsersAfter}`);
    console.log(`   Moyenne: ${(afterCount / uniqueUsersAfter).toFixed(2)} rôles/utilisateur`);
    console.log('');

    // Résumé
    const deletedRows = beforeCount - afterCount;
    const reductionPercent = ((deletedRows / beforeCount) * 100).toFixed(2);

    console.log('📈 RÉSUMÉ:');
    console.log(`   Lignes supprimées: ${deletedRows}`);
    console.log(`   Réduction: ${reductionPercent}%`);
    console.log('');

    // Vérification des doublons
    console.log('🔍 VÉRIFICATION DES DOUBLONS:');
    const { data: duplicates } = await supabase.rpc('check_user_roles_duplicates');
    
    if (!duplicates || duplicates.length === 0) {
      console.log('   ✅ Aucun doublon détecté');
    } else {
      console.log(`   ⚠️  ${duplicates.length} doublons restants`);
    }
    console.log('');

    console.log('═'.repeat(80));
    console.log('✅ MIGRATION 230 DÉPLOYÉE AVEC SUCCÈS');
    console.log('═'.repeat(80));
    console.log('');
    console.log('⚠️  ACTIONS REQUISES:');
    console.log('   1. Vider le cache frontend (localStorage)');
    console.log('   2. Recharger l\'application (Ctrl+Shift+R)');
    console.log('   3. Demander aux utilisateurs de se reconnecter');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('═'.repeat(80));
    console.error('❌ ERREUR LORS DU DÉPLOIEMENT');
    console.error('═'.repeat(80));
    console.error('');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('');
    console.error('💡 SOLUTION:');
    console.error('   Exécutez manuellement le fichier SQL dans le Dashboard Supabase:');
    console.error('   supabase/migrations/20250111000230_fix_user_roles_duplicates_and_trigger.sql');
    console.error('');
    process.exit(1);
  }
}

deployMigration230();
