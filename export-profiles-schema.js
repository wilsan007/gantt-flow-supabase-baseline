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
    // 1. STRUCTURE DES COLONNES
    // ============================================
    console.log('📋 1. Récupération de la structure des colonnes...');
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('*')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles')
      .order('ordinal_position');

    if (columnsError) {
      console.log('❌ Erreur colonnes:', columnsError.message);
      return;
    }

    console.log(`✅ ${columns?.length || 0} colonnes trouvées`);

    // ============================================
    // 2. CONTRAINTES ET INDEX
    // ============================================
    console.log('\n🔗 2. Récupération des contraintes...');
    
    const { data: constraints, error: constraintsError } = await supabase
      .from('information_schema.table_constraints')
      .select('*')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles');

    if (constraintsError) {
      console.log('❌ Erreur contraintes:', constraintsError.message);
    } else {
      console.log(`✅ ${constraints?.length || 0} contraintes trouvées`);
    }

    // ============================================
    // 3. DÉTAILS DES CONTRAINTES
    // ============================================
    console.log('\n🔑 3. Récupération des détails des contraintes...');
    
    const { data: keyUsage, error: keyError } = await supabase
      .from('information_schema.key_column_usage')
      .select('*')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles');

    if (keyError) {
      console.log('❌ Erreur key usage:', keyError.message);
    } else {
      console.log(`✅ ${keyUsage?.length || 0} usages de clés trouvés`);
    }

    // ============================================
    // 4. INDEX
    // ============================================
    console.log('\n📊 4. Récupération des index...');
    
    // Requête pour les index via une approche alternative
    const { data: indexData, error: indexError } = await supabase
      .from('pg_indexes')
      .select('*')
      .eq('schemaname', 'public')
      .eq('tablename', 'profiles');

    if (indexError) {
      console.log('⚠️ Erreur index (normal si pas d\'accès):', indexError.message);
    } else {
      console.log(`✅ ${indexData?.length || 0} index trouvés`);
    }

    // ============================================
    // 5. POLITIQUES RLS
    // ============================================
    console.log('\n🛡️ 5. Récupération des politiques RLS...');
    
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('schemaname', 'public')
      .eq('tablename', 'profiles');

    if (policiesError) {
      console.log('⚠️ Erreur politiques RLS:', policiesError.message);
    } else {
      console.log(`✅ ${policies?.length || 0} politiques RLS trouvées`);
    }

    // ============================================
    // 6. ASSEMBLAGE DU SCHÉMA COMPLET
    // ============================================
    console.log('\n🔧 6. Assemblage du schéma complet...');

    const schema = {
      export_date: new Date().toISOString(),
      table_name: 'profiles',
      schema_name: 'public',
      columns: columns || [],
      constraints: constraints || [],
      key_usage: keyUsage || [],
      indexes: indexData || [],
      rls_policies: policies || []
    };

    // ============================================
    // 7. GÉNÉRATION DU SCRIPT SQL CREATE TABLE
    // ============================================
    console.log('\n📝 7. Génération du script CREATE TABLE...');

    let createTableSQL = `-- Schéma complet de la table profiles
-- Généré le: ${new Date().toISOString()}
-- Base: ${process.env.VITE_SUPABASE_URL}

-- Supprimer la table si elle existe (pour recréation)
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Créer la table profiles
CREATE TABLE public.profiles (
`;

    // Ajouter les colonnes
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

    // Ajouter les contraintes de clé primaire
    const primaryKeys = keyUsage?.filter(k => 
      constraints?.some(c => c.constraint_name === k.constraint_name && c.constraint_type === 'PRIMARY KEY')
    );

    if (primaryKeys && primaryKeys.length > 0) {
      const pkColumns = primaryKeys.map(pk => pk.column_name).join(', ');
      createTableSQL += `,\n    PRIMARY KEY (${pkColumns})`;
    }

    // Ajouter les contraintes de clé étrangère
    const foreignKeys = keyUsage?.filter(k => 
      constraints?.some(c => c.constraint_name === k.constraint_name && c.constraint_type === 'FOREIGN KEY')
    );

    if (foreignKeys && foreignKeys.length > 0) {
      foreignKeys.forEach(fk => {
        const constraint = constraints.find(c => c.constraint_name === fk.constraint_name);
        if (constraint) {
          createTableSQL += `,\n    CONSTRAINT ${fk.constraint_name} FOREIGN KEY (${fk.column_name}) REFERENCES ${fk.referenced_table_name}(${fk.referenced_column_name})`;
        }
      });
    }

    createTableSQL += '\n);\n\n';

    // Ajouter les index
    if (indexData && indexData.length > 0) {
      createTableSQL += '-- Index\n';
      indexData.forEach(idx => {
        if (!idx.indexname.includes('_pkey')) { // Exclure les index de clé primaire
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
    // 8. SAUVEGARDE DES FICHIERS
    // ============================================
    console.log('\n💾 8. Sauvegarde des fichiers...');

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
- **Nombre d'index**: ${indexData?.length || 0}
- **Nombre de politiques RLS**: ${policies?.length || 0}

## Structure des colonnes

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
${columns?.map(col => 
  `| ${col.column_name} | ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''} | ${col.is_nullable} | ${col.column_default || 'N/A'} | |`
).join('\n') || ''}

## Contraintes

${constraints?.map(c => 
  `- **${c.constraint_name}** (${c.constraint_type})`
).join('\n') || 'Aucune contrainte'}

## Index

${indexData?.map(idx => 
  `- **${idx.indexname}**: ${idx.indexdef}`
).join('\n') || 'Aucun index'}

## Politiques RLS

${policies?.map(p => 
  `- **${p.policyname}** (${p.cmd}): ${p.qual || p.with_check || 'Aucune condition'}`
).join('\n') || 'Aucune politique RLS'}
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
    // 9. RÉSUMÉ
    // ============================================
    console.log('\n📊 RÉSUMÉ DU SCHÉMA:');
    console.log(`   📋 Colonnes: ${columns?.length || 0}`);
    console.log(`   🔗 Contraintes: ${constraints?.length || 0}`);
    console.log(`   📊 Index: ${indexData?.length || 0}`);
    console.log(`   🛡️ Politiques RLS: ${policies?.length || 0}`);

    if (columns && columns.length > 0) {
      console.log('\n📋 Types de colonnes:');
      const typeCount = {};
      columns.forEach(col => {
        const type = col.data_type;
        typeCount[type] = (typeCount[type] || 0) + 1;
      });
      Object.entries(typeCount).forEach(([type, count]) => {
        console.log(`   - ${type}: ${count} colonne(s)`);
      });
    }

    if (constraints && constraints.length > 0) {
      console.log('\n🔗 Types de contraintes:');
      const constraintTypes = {};
      constraints.forEach(c => {
        const type = c.constraint_type;
        constraintTypes[type] = (constraintTypes[type] || 0) + 1;
      });
      Object.entries(constraintTypes).forEach(([type, count]) => {
        console.log(`   - ${type}: ${count} contrainte(s)`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'export du schéma:', error.message);
  }
}

exportProfilesSchema();
