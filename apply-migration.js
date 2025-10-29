#!/usr/bin/env node

// Script pour appliquer la migration de normalisation
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('\n🚀 Application de la migration de normalisation...\n');

  // Lire le fichier de migration
  const migrationSQL = readFileSync(
    './supabase/migrations/20251008001000_normalize_tasks_project_relation.sql',
    'utf8'
  );

  try {
    // Exécuter la migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });

    if (error) {
      console.error('❌ Erreur lors de l\'exécution:', error.message);
      
      // Essayer méthode alternative: exécuter via REST API
      console.log('\n⚠️  Tentative avec méthode alternative...\n');
      
      // Diviser en plusieurs requêtes
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      console.log(`📝 ${statements.length} instructions SQL à exécuter\n`);
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        if (stmt.length < 50) continue; // Ignorer les petites instructions
        
        console.log(`[${i + 1}/${statements.length}] Exécution...`);
        
        const { error: stmtError } = await supabase.rpc('exec_sql', {
          sql_query: stmt + ';'
        });
        
        if (stmtError) {
          console.error(`❌ Erreur: ${stmtError.message}`);
        }
      }
    } else {
      console.log('✅ Migration appliquée avec succès!');
    }

    // Vérifier le résultat
    console.log('\n📊 Vérification du résultat...\n');
    
    const { data: project } = await supabase
      .from('projects')
      .select('name, progress, estimated_hours')
      .eq('name', 'Application Mobile')
      .single();

    if (project) {
      console.log(`✅ Projet: ${project.name}`);
      console.log(`   Progression: ${project.progress}%`);
      console.log(`   Effort total: ${project.estimated_hours}h`);
    }

    const { data: tasks } = await supabase
      .from('tasks')
      .select('title, project_id, project_name, estimated_hours, progress')
      .eq('project_name', 'Application Mobile')
      .order('title');

    if (tasks) {
      console.log(`\n📝 ${tasks.length} tâches trouvées:`);
      tasks.forEach(t => {
        console.log(`   - ${t.title}: ${t.estimated_hours || 0}h × ${t.progress || 0}%`);
      });
    }

  } catch (err) {
    console.error('❌ Erreur:', err.message);
  }
}

console.log('⚠️  ATTENTION: Cette migration va modifier la structure de la base de données!');
console.log('📋 Actions:');
console.log('   1. Migrer project_name vers project_id');
console.log('   2. Transformer project_name en colonne générée');
console.log('   3. Recalculer toutes les progressions');
console.log('\n⏳ Démarrage dans 3 secondes...\n');

setTimeout(() => {
  applyMigration().catch(console.error);
}, 3000);
