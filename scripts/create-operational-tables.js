#!/usr/bin/env node

/**
 * Script de Création des Tables Opérationnelles
 * Exécute les migrations SQL dans l'ordre correct
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// =====================================================
// Configuration
// =====================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erreur : Variables d\'environnement manquantes');
  console.error('Veuillez définir VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// =====================================================
// Ordre d'exécution des scripts SQL
// =====================================================

const MIGRATIONS = [
  {
    file: '02-create-operational-tables.sql',
    description: 'Création des tables opérationnelles'
  },
  {
    file: '03-setup-rls-policies.sql',
    description: 'Configuration RLS et policies'
  },
  {
    file: '04-create-rpc-functions.sql',
    description: 'Création des fonctions RPC'
  }
];

// =====================================================
// Fonctions utilitaires
// =====================================================

function readSQLFile(filename) {
  const filePath = path.join(__dirname, '../supabase/sql', filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Fichier SQL non trouvé: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf-8');
}

async function executeSQLMigration(migration) {
  console.log(`\n📝 ${migration.description}...`);
  console.log(`   Fichier: ${migration.file}`);

  try {
    const sql = readSQLFile(migration.file);

    // Supprimer les commentaires de style -- et /* */
    const cleanedSQL = sql
      .replace(/--.*$/gm, '')  // Commentaires --
      .replace(/\/\*[\s\S]*?\*\//g, '')  // Commentaires /* */
      .trim();

    // Séparer les statements SQL (approximatif)
    const statements = cleanedSQL
      .split(/;(?=(?:[^']*'[^']*')*[^']*$)/)  // Split sur ; en dehors des strings
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`   📊 ${statements.length} statement(s) à exécuter`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (stmt.length === 0) continue;

      try {
        // Exécuter via requête RPC générique (si disponible)
        const { data, error } = await supabase.rpc('exec', { sql: stmt });

        if (error) {
          // Fallback: essayer d'exécuter directement
          console.warn(`   ⚠️  Statement ${i + 1}/${statements.length}: ${error.message.substring(0, 80)}...`);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        console.warn(`   ⚠️  Statement ${i + 1}/${statements.length}: ${err.message.substring(0, 80)}...`);
        errorCount++;
      }
    }

    if (errorCount === 0) {
      console.log(`   ✅ ${migration.description} - ${successCount} statement(s) exécuté(s)`);
    } else {
      console.log(`   ⚠️  ${migration.description} - ${successCount} réussis, ${errorCount} erreurs`);
    }

    return { success: errorCount === 0, successCount, errorCount };

  } catch (error) {
    console.error(`   ❌ Erreur lors de la lecture du fichier: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// =====================================================
// Exécution principale
// =====================================================

async function runMigrations() {
  console.log('═══════════════════════════════════════════════════');
  console.log('🚀 CRÉATION DES TABLES OPÉRATIONNELLES');
  console.log('═══════════════════════════════════════════════════');
  console.log(`📍 URL: ${SUPABASE_URL}`);
  console.log(`⏰ Date: ${new Date().toISOString()}`);
  console.log();

  // Vérifier la connexion
  console.log('🔍 Vérification de la connexion Supabase...');
  const { data: testData, error: testError } = await supabase
    .from('operational_activities')
    .select('count')
    .limit(0);

  if (testError && testError.code !== 'PGRST116') { // PGRST116 = table not found (normal)
    console.log('✅ Connexion Supabase établie');
  }

  // Exécuter les migrations dans l'ordre
  let totalSuccess = 0;
  let totalErrors = 0;

  for (const migration of MIGRATIONS) {
    const result = await executeSQLMigration(migration);

    if (result.success) {
      totalSuccess++;
    } else {
      totalErrors++;
    }
  }

  // Résumé
  console.log('\n═══════════════════════════════════════════════════');
  console.log('📊 RÉSUMÉ DE L\'EXÉCUTION');
  console.log('═══════════════════════════════════════════════════');
  console.log(`✅ Migrations réussies: ${totalSuccess}/${MIGRATIONS.length}`);
  console.log(`❌ Migrations en erreur: ${totalErrors}/${MIGRATIONS.length}`);

  if (totalErrors === 0) {
    console.log('\n🎉 TOUTES LES MIGRATIONS ONT ÉTÉ EXÉCUTÉES AVEC SUCCÈS !');
    console.log('\n🚀 PROCHAINES ÉTAPES:');
    console.log('   1. Développer l\'Edge Function operational-instantiator');
    console.log('   2. Créer les composants UI React');
    console.log('   3. Tester le système complet');
  } else {
    console.log('\n⚠️  CERTAINES MIGRATIONS ONT ÉCHOUÉ');
    console.log('\n📝 ACTIONS RECOMMANDÉES:');
    console.log('   1. Exécuter les scripts SQL manuellement dans Supabase SQL Editor');
    console.log('   2. Vérifier les logs d\'erreur ci-dessus');
    console.log('   3. Corriger les problèmes et ré-exécuter');
    console.log('\n📂 Fichiers SQL: /supabase/sql/');
  }

  console.log('\n═══════════════════════════════════════════════════\n');

  process.exit(totalErrors > 0 ? 1 : 0);
}

// =====================================================
// Point d'entrée
// =====================================================

runMigrations().catch((error) => {
  console.error('\n❌ ERREUR FATALE:', error);
  process.exit(1);
});
