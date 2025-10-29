/**
 * Script pour appliquer les migrations de correction des dates
 * Applique uniquement:
 * 1. fix_task_dates_alignment.sql - Correction des dates
 * 2. add_date_validation_constraints.sql - Contraintes de validation
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '.env.local') });
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSqlFile(filePath, description) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📄 ${description}`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    // Lire le fichier SQL
    const sqlContent = readFileSync(filePath, 'utf8');
    
    // Exécuter le SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      // Si la fonction exec_sql n'existe pas, essayer directement
      console.log('⚠️  Fonction exec_sql non disponible, exécution directe...');
      
      // Diviser en statements individuels et exécuter
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.toLowerCase().includes('begin') || 
            statement.toLowerCase().includes('commit') ||
            statement.toLowerCase().includes('raise notice')) {
          continue; // Ignorer les commandes de transaction et notices
        }
        
        const { error: stmtError } = await supabase.rpc('exec', { 
          query: statement 
        });
        
        if (stmtError) {
          console.error(`❌ Erreur:`, stmtError.message);
          return false;
        }
      }
    }
    
    console.log(`✅ Migration appliquée avec succès`);
    return true;
    
  } catch (err) {
    console.error(`❌ Erreur lors de l'exécution:`, err.message);
    return false;
  }
}

async function applyMigrations() {
  console.log('🚀 Application des migrations de correction des dates\n');

  const migrations = [
    {
      file: join(__dirname, 'supabase/migrations/20250110230500_fix_task_dates_alignment.sql'),
      description: '1️⃣  Correction des dates des tâches'
    },
    {
      file: join(__dirname, 'supabase/migrations/20250110230600_add_date_validation_constraints.sql'),
      description: '2️⃣  Ajout des contraintes de validation'
    }
  ];

  let allSuccess = true;

  for (const migration of migrations) {
    const success = await executeSqlFile(migration.file, migration.description);
    if (!success) {
      allSuccess = false;
      console.log(`\n⚠️  Migration ${migration.description} a échoué, mais on continue...\n`);
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  
  if (allSuccess) {
    console.log('✅ Toutes les migrations ont été appliquées avec succès !');
  } else {
    console.log('⚠️  Certaines migrations ont échoué. Vérifiez les erreurs ci-dessus.');
  }
  
  console.log(`${'='.repeat(80)}\n`);

  // Vérifier les résultats
  console.log('📊 Vérification des résultats...\n');
  
  try {
    // Compter les tâches avec dates incohérentes
    const { data: inconsistentTasks, error } = await supabase
      .from('tasks')
      .select('id, title, start_date, due_date, project_id, projects(name, start_date, end_date)')
      .not('project_id', 'is', null);

    if (error) throw error;

    let issuesCount = 0;
    
    for (const task of inconsistentTasks || []) {
      if (!task.projects) continue;
      
      const taskStart = new Date(task.start_date);
      const taskEnd = new Date(task.due_date);
      const projectStart = new Date(task.projects.start_date);
      const projectEnd = new Date(task.projects.end_date);
      
      if (taskStart < projectStart || taskEnd > projectEnd) {
        issuesCount++;
        console.log(`❌ Tâche "${task.title}" a encore des dates incohérentes`);
      }
    }
    
    if (issuesCount === 0) {
      console.log('✅ Aucune tâche avec dates incohérentes trouvée !');
    } else {
      console.log(`\n⚠️  ${issuesCount} tâche(s) ont encore des dates incohérentes`);
    }
    
  } catch (err) {
    console.log('⚠️  Impossible de vérifier les résultats:', err.message);
  }

  console.log('\n🎉 Processus terminé !\n');
}

// Exécuter
applyMigrations().catch(console.error);
