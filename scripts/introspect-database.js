#!/usr/bin/env node

/**
 * Script d'Introspection de la Base de Données
 * Analyse la structure actuelle avant de créer les tables opérationnelles
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// =====================================================
// Configuration
// =====================================================

// ESM equivalent de __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement (priorité: .env.local puis .env)
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erreur : Variables d\'environnement manquantes');
  console.error('Veuillez définir VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// =====================================================
// Fonctions d'Introspection
// =====================================================

async function executeQuery(name, query) {
  console.log(`\n🔍 ${name}...`);
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
    
    if (error) {
      // Si la fonction RPC n'existe pas, essayer une approche directe
      const { data: directData, error: directError } = await supabase
        .from('_temp_query')
        .select('*');
      
      if (directError) {
        console.error(`❌ Erreur:`, directError.message);
        return null;
      }
      return directData;
    }
    
    console.log(`✅ ${name} - ${data?.length || 0} résultats`);
    return data;
  } catch (err) {
    console.error(`❌ Erreur lors de l'exécution:`, err.message);
    return null;
  }
}

async function introspectDatabase() {
  console.log('═══════════════════════════════════════════════════');
  console.log('🔍 INTROSPECTION DE LA BASE DE DONNÉES');
  console.log('═══════════════════════════════════════════════════');
  console.log(`📍 URL: ${SUPABASE_URL}`);
  console.log(`⏰ Date: ${new Date().toISOString()}`);

  const results = {};

  // =====================================================
  // 1. Structure de la table tasks
  // =====================================================
  console.log('\n📋 ÉTAPE 1: Structure de la table tasks');
  const { data: tasksColumns, error: tasksError } = await supabase
    .rpc('get_table_columns', { table_name: 'tasks' });

  if (tasksError) {
    console.log('⚠️  Utilisation de la requête SQL directe...');
    // Fallback: Utiliser une requête SQL brute
    const query = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'tasks'
      ORDER BY ordinal_position
    `;
    // Pour l'instant, afficher la requête à exécuter manuellement
    console.log('📝 Requête à exécuter dans Supabase SQL Editor:');
    console.log(query);
  } else {
    results.tasksColumns = tasksColumns;
    console.log('✅ Colonnes de tasks:', tasksColumns?.length || 0);
    if (tasksColumns) {
      tasksColumns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)'}`);
      });
    }
  }

  // =====================================================
  // 2. Vérifier si task_actions existe
  // =====================================================
  console.log('\n📋 ÉTAPE 2: Vérification de task_actions');
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'task_actions');

  if (!tablesError && tables) {
    const taskActionsExists = tables.length > 0;
    results.taskActionsExists = taskActionsExists;
    console.log(`✅ task_actions existe: ${taskActionsExists ? 'OUI' : 'NON'}`);
  }

  // =====================================================
  // 3. Vérifier les colonnes activity_id et is_operational
  // =====================================================
  console.log('\n📋 ÉTAPE 3: Vérification des colonnes activity_id et is_operational');
  
  // Méthode simple: essayer de sélectionner ces colonnes
  try {
    const { data: testColumns, error: testError } = await supabase
      .from('tasks')
      .select('activity_id, is_operational')
      .limit(1);

    if (testError) {
      if (testError.message.includes('activity_id') || testError.message.includes('is_operational')) {
        console.log('✅ Colonnes activity_id et is_operational n\'existent PAS (à créer)');
        results.needsActivityColumns = true;
      }
    } else {
      console.log('⚠️  Colonnes activity_id et/ou is_operational existent DÉJÀ');
      results.needsActivityColumns = false;
    }
  } catch (err) {
    console.log('✅ Colonnes n\'existent pas (à créer)');
    results.needsActivityColumns = true;
  }

  // =====================================================
  // 4. Lister toutes les tables
  // =====================================================
  console.log('\n📋 ÉTAPE 4: Liste de toutes les tables');
  const { data: allTables, error: allTablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .order('table_name');

  if (!allTablesError && allTables) {
    results.allTables = allTables.map(t => t.table_name);
    console.log(`✅ ${allTables.length} tables trouvées:`);
    allTables.forEach(t => console.log(`   - ${t.table_name}`));
  }

  // =====================================================
  // Sauvegarder les résultats
  // =====================================================
  const outputPath = path.join(__dirname, '../supabase/introspection-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log('\n✅ Résultats sauvegardés dans:', outputPath);

  // =====================================================
  // Afficher le résumé
  // =====================================================
  console.log('\n═══════════════════════════════════════════════════');
  console.log('📊 RÉSUMÉ DE L\'INTROSPECTION');
  console.log('═══════════════════════════════════════════════════');
  console.log(`✅ Table tasks: ${tasksColumns ? 'EXISTE' : 'À VÉRIFIER'}`);
  console.log(`✅ Table task_actions: ${results.taskActionsExists ? 'EXISTE' : 'N\'EXISTE PAS'}`);
  console.log(`✅ Colonnes à créer: ${results.needsActivityColumns ? 'activity_id, is_operational' : 'AUCUNE (déjà présentes)'}`);
  console.log(`✅ Nombre de tables: ${results.allTables?.length || 0}`);

  // =====================================================
  // Prochaines étapes
  // =====================================================
  console.log('\n═══════════════════════════════════════════════════');
  console.log('🚀 PROCHAINES ÉTAPES');
  console.log('═══════════════════════════════════════════════════');
  
  if (results.needsActivityColumns) {
    console.log('✅ 1. Les colonnes activity_id et is_operational peuvent être créées');
    console.log('✅ 2. Exécuter le script: supabase/sql/02-create-operational-tables.sql');
  } else {
    console.log('⚠️  1. Les colonnes activity_id et/ou is_operational existent déjà');
    console.log('⚠️  2. Vérifier manuellement avant d\'exécuter les scripts suivants');
  }

  if (!results.taskActionsExists) {
    console.log('⚠️  3. La table task_actions n\'existe pas');
    console.log('⚠️  4. Adapter les scripts pour créer task_actions OU utiliser une autre table');
  }

  console.log('\n═══════════════════════════════════════════════════\n');
}

// =====================================================
// Exécution
// =====================================================

introspectDatabase()
  .then(() => {
    console.log('✅ Introspection terminée avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur lors de l\'introspection:', error);
    process.exit(1);
  });
