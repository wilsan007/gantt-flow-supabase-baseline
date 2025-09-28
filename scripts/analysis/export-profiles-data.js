import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function exportProfilesData() {
  console.log('📊 EXPORT DES DONNÉES DE LA TABLE PROFILES');
  console.log('==========================================\n');

  try {
    // Récupérer toutes les entrées de la table profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.log('❌ Erreur lors de la récupération des profiles:', error.message);
      return;
    }

    console.log(`✅ ${profiles?.length || 0} entrées trouvées dans la table profiles`);

    if (!profiles || profiles.length === 0) {
      console.log('ℹ️ Aucune donnée à exporter');
      
      // Créer un fichier vide avec structure
      const emptyData = {
        export_date: new Date().toISOString(),
        table: 'profiles',
        count: 0,
        data: [],
        structure_info: 'Table profiles vide - aucune donnée à exporter'
      };
      
      writeFileSync(
        '/home/awaleh/Documents/Wadashaqeen-SaaS/gantt-flow-next/profiles-export.json',
        JSON.stringify(emptyData, null, 2),
        'utf8'
      );
      
      console.log('✅ Fichier profiles-export.json créé (vide)');
      return;
    }

    // Analyser la structure des données
    const firstProfile = profiles[0];
    const columns = Object.keys(firstProfile);
    
    console.log('\n📋 Structure des données:');
    columns.forEach(col => {
      const sampleValue = firstProfile[col];
      const type = typeof sampleValue;
      console.log(`   - ${col}: ${type} (exemple: ${sampleValue})`);
    });

    // Préparer les données d'export
    const exportData = {
      export_date: new Date().toISOString(),
      table: 'profiles',
      count: profiles.length,
      columns: columns,
      data: profiles
    };

    // Sauvegarder en JSON
    writeFileSync(
      '/home/awaleh/Documents/Wadashaqeen-SaaS/gantt-flow-next/profiles-export.json',
      JSON.stringify(exportData, null, 2),
      'utf8'
    );

    // Sauvegarder en CSV
    const csvHeader = columns.join(',');
    const csvRows = profiles.map(profile => 
      columns.map(col => {
        const value = profile[col];
        // Échapper les guillemets et virgules
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    );
    
    const csvContent = [csvHeader, ...csvRows].join('\n');
    
    writeFileSync(
      '/home/awaleh/Documents/Wadashaqeen-SaaS/gantt-flow-next/profiles-export.csv',
      csvContent,
      'utf8'
    );

    // Créer un fichier SQL d'insertion
    const sqlInserts = profiles.map(profile => {
      const columnNames = columns.join(', ');
      const values = columns.map(col => {
        const value = profile[col];
        if (value === null || value === undefined) return 'NULL';
        if (typeof value === 'string') {
          return `'${value.replace(/'/g, "''")}'`;
        }
        if (typeof value === 'boolean') {
          return value ? 'true' : 'false';
        }
        return String(value);
      }).join(', ');
      
      return `INSERT INTO profiles (${columnNames}) VALUES (${values});`;
    }).join('\n');

    const sqlContent = `-- Export de la table profiles
-- Date: ${new Date().toISOString()}
-- Nombre d'entrées: ${profiles.length}

${sqlInserts}`;

    writeFileSync(
      '/home/awaleh/Documents/Wadashaqeen-SaaS/gantt-flow-next/profiles-export.sql',
      sqlContent,
      'utf8'
    );

    console.log('\n✅ Fichiers d\'export créés:');
    console.log('   📄 profiles-export.json - Données complètes en JSON');
    console.log('   📊 profiles-export.csv - Format CSV pour Excel');
    console.log('   🗃️ profiles-export.sql - Script SQL d\'insertion');

    // Afficher un résumé des données
    console.log('\n📈 RÉSUMÉ DES DONNÉES:');
    console.log(`   📊 Total entrées: ${profiles.length}`);
    
    // Compter par tenant_id si la colonne existe
    if (columns.includes('tenant_id')) {
      const tenantCounts = {};
      profiles.forEach(profile => {
        const tenantId = profile.tenant_id || 'NULL';
        tenantCounts[tenantId] = (tenantCounts[tenantId] || 0) + 1;
      });
      
      console.log('   🏢 Répartition par tenant:');
      Object.entries(tenantCounts).forEach(([tenantId, count]) => {
        console.log(`      - ${tenantId}: ${count} profil(s)`);
      });
    }

    // Compter par rôle si la colonne existe
    if (columns.includes('role')) {
      const roleCounts = {};
      profiles.forEach(profile => {
        const role = profile.role || 'NULL';
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      });
      
      console.log('   👤 Répartition par rôle:');
      Object.entries(roleCounts).forEach(([role, count]) => {
        console.log(`      - ${role}: ${count} profil(s)`);
      });
    }

    // Afficher les 3 premiers profils comme exemple
    if (profiles.length > 0) {
      console.log('\n📋 Aperçu des données (3 premiers profils):');
      profiles.slice(0, 3).forEach((profile, index) => {
        console.log(`\n   ${index + 1}. Profil ID: ${profile.id || profile.user_id}`);
        Object.entries(profile).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            const displayValue = String(value).length > 50 
              ? String(value).substring(0, 47) + '...' 
              : String(value);
            console.log(`      ${key}: ${displayValue}`);
          }
        });
      });
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'export:', error.message);
  }
}

exportProfilesData();
