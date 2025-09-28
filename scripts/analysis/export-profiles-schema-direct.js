import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function exportProfilesSchema() {
  console.log('🏗️ EXPORT DU SCHÉMA COMPLET DE LA TABLE PROFILES');
  console.log('================================================\n');

  try {
    // ============================================
    // 1. REQUÊTE SQL DIRECTE POUR LE SCHÉMA
    // ============================================
    console.log('📋 1. Récupération de la structure via SQL direct...');
    
    const schemaQuery = `
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default,
        ordinal_position
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'profiles'
      ORDER BY ordinal_position;
    `;

    const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', {
      sql: schemaQuery
    });

    if (columnsError) {
      console.log('⚠️ Erreur avec exec_sql, utilisation d\'une approche alternative...');
      
      // Approche alternative : analyser un enregistrement existant
      const { data: sampleData, error: sampleError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      if (sampleError) {
        console.log('❌ Impossible de récupérer les données:', sampleError.message);
        return;
      }

      if (!sampleData || sampleData.length === 0) {
        console.log('❌ Aucune donnée dans la table profiles');
        return;
      }

      // Analyser la structure à partir des données
      const sample = sampleData[0];
      const inferredColumns = Object.keys(sample).map((key, index) => {
        const value = sample[key];
        let dataType = 'unknown';
        
        if (value === null) {
          dataType = 'nullable';
        } else if (typeof value === 'string') {
          // Vérifier si c'est un UUID
          if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
            dataType = 'uuid';
          } else if (value.includes('T') && value.includes('Z')) {
            dataType = 'timestamp with time zone';
          } else {
            dataType = 'text';
          }
        } else if (typeof value === 'number') {
          dataType = Number.isInteger(value) ? 'integer' : 'numeric';
        } else if (typeof value === 'boolean') {
          dataType = 'boolean';
        }

        return {
          column_name: key,
          data_type: dataType,
          ordinal_position: index + 1,
          is_nullable: value === null ? 'YES' : 'UNKNOWN',
          column_default: null,
          character_maximum_length: null
        };
      });

      console.log(`✅ ${inferredColumns.length} colonnes analysées à partir des données`);
      
      await generateSchemaFiles(inferredColumns, [], [], [], []);
      return;
    }

    console.log(`✅ ${columns?.length || 0} colonnes trouvées`);

    // ============================================
    // 2. CONTRAINTES
    // ============================================
    console.log('\n🔗 2. Récupération des contraintes...');
    
    const constraintsQuery = `
      SELECT 
        constraint_name,
        constraint_type,
        table_name
      FROM information_schema.table_constraints 
      WHERE table_schema = 'public' 
        AND table_name = 'profiles';
    `;

    const { data: constraints, error: constraintsError } = await supabase.rpc('exec_sql', {
      sql: constraintsQuery
    });

    if (constraintsError) {
      console.log('⚠️ Erreur contraintes:', constraintsError.message);
    }

    // ============================================
    // 3. CLÉS
    // ============================================
    console.log('\n🔑 3. Récupération des clés...');
    
    const keysQuery = `
      SELECT 
        constraint_name,
        column_name,
        referenced_table_name,
        referenced_column_name
      FROM information_schema.key_column_usage 
      WHERE table_schema = 'public' 
        AND table_name = 'profiles';
    `;

    const { data: keyUsage, error: keyError } = await supabase.rpc('exec_sql', {
      sql: keysQuery
    });

    if (keyError) {
      console.log('⚠️ Erreur clés:', keyError.message);
    }

    // ============================================
    // 4. INDEX (approche alternative)
    // ============================================
    console.log('\n📊 4. Récupération des index...');
    
    const indexQuery = `
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public' 
        AND tablename = 'profiles';
    `;

    const { data: indexes, error: indexError } = await supabase.rpc('exec_sql', {
      sql: indexQuery
    });

    if (indexError) {
      console.log('⚠️ Erreur index:', indexError.message);
    }

    // ============================================
    // 5. POLITIQUES RLS
    // ============================================
    console.log('\n🛡️ 5. Récupération des politiques RLS...');
    
    const rlsQuery = `
      SELECT 
        policyname,
        cmd,
        qual,
        with_check,
        roles
      FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = 'profiles';
    `;

    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
      sql: rlsQuery
    });

    if (policiesError) {
      console.log('⚠️ Erreur politiques RLS:', policiesError.message);
    }

    // ============================================
    // 6. GÉNÉRATION DES FICHIERS
    // ============================================
    await generateSchemaFiles(
      columns || [],
      constraints || [],
      keyUsage || [],
      indexes || [],
      policies || []
    );

  } catch (error) {
    console.error('❌ Erreur lors de l\'export du schéma:', error.message);
  }
}

async function generateSchemaFiles(columns, constraints, keyUsage, indexes, policies) {
  console.log('\n🔧 Génération des fichiers de schéma...');

  const schema = {
    export_date: new Date().toISOString(),
    table_name: 'profiles',
    schema_name: 'public',
    columns: columns,
    constraints: constraints,
    key_usage: keyUsage,
    indexes: indexes,
    rls_policies: policies
  };

  // ============================================
  // SCRIPT SQL CREATE TABLE
  // ============================================
  let createTableSQL = `-- Schéma complet de la table profiles
-- Généré le: ${new Date().toISOString()}
-- Base: ${process.env.VITE_SUPABASE_URL}

-- Supprimer la table si elle existe (pour recréation)
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Créer la table profiles
CREATE TABLE public.profiles (
`;

  // Ajouter les colonnes
  if (columns && columns.length > 0) {
    const columnDefinitions = columns.map(col => {
      let definition = `    ${col.column_name} ${col.data_type}`;
      
      // Ajouter la longueur pour les types qui en ont besoin
      if (col.character_maximum_length) {
        definition += `(${col.character_maximum_length})`;
      }
      
      // Ajouter NOT NULL si nécessaire
      if (col.is_nullable === 'NO') {
        definition += ' NOT NULL';
      }
      
      // Ajouter la valeur par défaut
      if (col.column_default) {
        definition += ` DEFAULT ${col.column_default}`;
      }
      
      return definition;
    }).join(',\n');

    createTableSQL += columnDefinitions;
  }

  // Ajouter les contraintes de clé primaire
  const primaryKeys = keyUsage?.filter(k => 
    constraints?.some(c => c.constraint_name === k.constraint_name && c.constraint_type === 'PRIMARY KEY')
  );

  if (primaryKeys && primaryKeys.length > 0) {
    const pkColumns = primaryKeys.map(pk => pk.column_name).join(', ');
    createTableSQL += `,\n    PRIMARY KEY (${pkColumns})`;
  }

  createTableSQL += '\n);\n\n';

  // Ajouter les index
  if (indexes && indexes.length > 0) {
    createTableSQL += '-- Index\n';
    indexes.forEach(idx => {
      if (!idx.indexname.includes('_pkey')) {
        createTableSQL += `${idx.indexdef};\n`;
      }
    });
    createTableSQL += '\n';
  }

  // Ajouter les politiques RLS
  if (policies && policies.length > 0) {
    createTableSQL += '-- Activer RLS\nALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;\n\n';
    createTableSQL += '-- Politiques RLS\n';
    policies.forEach(policy => {
      createTableSQL += `CREATE POLICY "${policy.policyname}" ON public.profiles\n`;
      createTableSQL += `    FOR ${policy.cmd}`;
      if (policy.roles && policy.roles.length > 0) {
        createTableSQL += ` TO ${policy.roles.join(', ')}`;
      }
      if (policy.qual) {
        createTableSQL += `\n    USING (${policy.qual})`;
      }
      if (policy.with_check) {
        createTableSQL += `\n    WITH CHECK (${policy.with_check})`;
      }
      createTableSQL += ';\n\n';
    });
  }

  // ============================================
  // SAUVEGARDE DES FICHIERS
  // ============================================
  console.log('\n💾 Sauvegarde des fichiers...');

  // Fichier JSON complet
  writeFileSync(
    '/home/awaleh/Documents/Wadashaqeen-SaaS/gantt-flow-next/profiles-schema.json',
    JSON.stringify(schema, null, 2),
    'utf8'
  );

  // Fichier SQL
  writeFileSync(
    '/home/awaleh/Documents/Wadashaqeen-SaaS/gantt-flow-next/profiles-schema.sql',
    createTableSQL,
    'utf8'
  );

  // Fichier de documentation
  const documentation = `# Schéma de la table profiles

## Informations générales
- **Table**: profiles
- **Schéma**: public
- **Date d'export**: ${new Date().toISOString()}
- **Nombre de colonnes**: ${columns?.length || 0}
- **Nombre de contraintes**: ${constraints?.length || 0}
- **Nombre d'index**: ${indexes?.length || 0}
- **Nombre de politiques RLS**: ${policies?.length || 0}

## Structure des colonnes

| Colonne | Type | Nullable | Défaut | Position |
|---------|------|----------|--------|----------|
${columns?.map(col => 
  `| ${col.column_name} | ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''} | ${col.is_nullable} | ${col.column_default || 'N/A'} | ${col.ordinal_position} |`
).join('\n') || 'Aucune colonne'}

## Contraintes

${constraints?.map(c => 
  `- **${c.constraint_name}** (${c.constraint_type})`
).join('\n') || 'Aucune contrainte'}

## Index

${indexes?.map(idx => 
  `- **${idx.indexname}**: ${idx.indexdef}`
).join('\n') || 'Aucun index'}

## Politiques RLS

${policies?.map(p => 
  `- **${p.policyname}** (${p.cmd}): ${p.qual || p.with_check || 'Aucune condition'}`
).join('\n') || 'Aucune politique RLS'}

## Colonnes détaillées

${columns?.map(col => `
### ${col.column_name}
- **Type**: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}
- **Nullable**: ${col.is_nullable}
- **Défaut**: ${col.column_default || 'N/A'}
- **Position**: ${col.ordinal_position}
`).join('\n') || 'Aucune colonne'}
`;

  writeFileSync(
    '/home/awaleh/Documents/Wadashaqeen-SaaS/gantt-flow-next/profiles-schema.md',
    documentation,
    'utf8'
  );

  console.log('✅ Fichiers de schéma créés:');
  console.log('   📄 profiles-schema.json - Schéma complet en JSON');
  console.log('   🗃️ profiles-schema.sql - Script CREATE TABLE complet');
  console.log('   📖 profiles-schema.md - Documentation lisible');

  // ============================================
  // RÉSUMÉ
  // ============================================
  console.log('\n📊 RÉSUMÉ DU SCHÉMA:');
  console.log(`   📋 Colonnes: ${columns?.length || 0}`);
  console.log(`   🔗 Contraintes: ${constraints?.length || 0}`);
  console.log(`   📊 Index: ${indexes?.length || 0}`);
  console.log(`   🛡️ Politiques RLS: ${policies?.length || 0}`);

  if (columns && columns.length > 0) {
    console.log('\n📋 Détail des colonnes:');
    columns.forEach(col => {
      console.log(`   ${col.ordinal_position}. ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });
  }
}

exportProfilesSchema();
