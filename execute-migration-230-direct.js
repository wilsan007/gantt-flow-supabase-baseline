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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeMigration230() {
  console.log('');
  console.log('═'.repeat(80));
  console.log('🚀 EXÉCUTION MIGRATION 230 - Correction Doublons user_roles');
  console.log('═'.repeat(80));
  console.log('');

  try {
    // Statistiques AVANT
    console.log('📊 STATISTIQUES AVANT:');
    const { count: beforeCount } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true });
    
    console.log(`   Total lignes: ${beforeCount}`);
    console.log('');

    // Lire la migration
    const migrationPath = join(__dirname, 'supabase', 'migrations', '20250111000230_fix_user_roles_duplicates_and_trigger.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('⚙️  EXÉCUTION DE LA MIGRATION...');
    console.log('');

    // Diviser le SQL en commandes individuelles et les exécuter
    // Pour PostgreSQL, on doit utiliser une connexion directe
    console.log('📝 Instructions pour exécution manuelle:');
    console.log('');
    console.log('1. Ouvrez le Dashboard Supabase:');
    console.log(`   ${supabaseUrl.replace('//', '//app.')}/project/_/sql`);
    console.log('');
    console.log('2. Copiez et exécutez le contenu du fichier:');
    console.log('   supabase/migrations/20250111000230_fix_user_roles_duplicates_and_trigger.sql');
    console.log('');
    console.log('3. Ou utilisez la commande Supabase CLI:');
    console.log('   npx supabase db push');
    console.log('');

    // Afficher un aperçu de ce qui sera fait
    console.log('📋 APERÇU DES ACTIONS:');
    console.log('   1. Suppression des doublons (garder le plus récent)');
    console.log('   2. Ajout contrainte UNIQUE (user_id, role_id, tenant_id)');
    console.log('   3. Correction du trigger webhook');
    console.log('');

    // Calculer combien de lignes seront supprimées
    const { data: uniqueCombinations } = await supabase
      .from('user_roles')
      .select('user_id, role_id, tenant_id');
    
    const uniqueCount = new Set(
      uniqueCombinations?.map(r => `${r.user_id}-${r.role_id}-${r.tenant_id}`)
    ).size;

    const toDelete = beforeCount - uniqueCount;
    const reductionPercent = ((toDelete / beforeCount) * 100).toFixed(2);

    console.log('📈 IMPACT ESTIMÉ:');
    console.log(`   Lignes à supprimer: ${toDelete}`);
    console.log(`   Lignes à conserver: ${uniqueCount}`);
    console.log(`   Réduction: ${reductionPercent}%`);
    console.log('');

    console.log('═'.repeat(80));
    console.log('⚠️  VEUILLEZ EXÉCUTER LA MIGRATION MANUELLEMENT');
    console.log('═'.repeat(80));
    console.log('');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

executeMigration230();
