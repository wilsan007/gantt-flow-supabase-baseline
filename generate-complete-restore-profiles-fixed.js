import { readFileSync, writeFileSync } from 'fs';

// Lire les données exportées
const exportData = JSON.parse(readFileSync('/home/awaleh/Documents/Wadashaqeen-SaaS/gantt-flow-next/profiles-export.json', 'utf8'));

console.log('🔄 GÉNÉRATION DU SCRIPT DE RESTAURATION COMPLET (CORRIGÉ)');
console.log('========================================================\n');

console.log(`📊 Données trouvées: ${exportData.count} profils`);
console.log(`📋 Colonnes: ${exportData.columns.join(', ')}`);

// Fonction pour échapper les valeurs SQL
function escapeSqlValue(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'string') {
    return `'${value.replace(/'/g, "''")}'`;
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  return 'NULL';
}

// Générer le script SQL complet
let sqlScript = `-- Script de restauration complète des ${exportData.count} profils
-- Généré automatiquement le ${new Date().toISOString()}
-- Basé sur l'export du ${exportData.export_date}

-- Désactiver temporairement RLS pour l'insertion
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Supprimer les données existantes (optionnel)
-- TRUNCATE TABLE public.profiles CASCADE;

-- ============================================
-- INSERTION DE TOUS LES PROFILS
-- ============================================

`;

let insertCount = 0;

exportData.data.forEach((profile, index) => {
  insertCount++;
  console.log(`📝 Traitement profil ${insertCount}/${exportData.count}: ${profile.full_name} (${profile.role || 'no role'})`);
  
  // Générer un email si manquant
  let email = profile.email;
  if (!email && profile.full_name) {
    email = profile.full_name.toLowerCase()
      .replace(/\s+/g, '.')
      .replace(/[^a-z0-9.]/g, '') + '@example.com';
  }
  
  // Adapter les données à la nouvelle structure
  const values = [
    escapeSqlValue(profile.id),
    escapeSqlValue(profile.user_id),
    escapeSqlValue(profile.tenant_id),
    escapeSqlValue(profile.full_name),
    escapeSqlValue(email),
    escapeSqlValue(profile.phone),
    escapeSqlValue(profile.avatar_url),
    escapeSqlValue(profile.employee_id),
    escapeSqlValue(profile.job_title),
    escapeSqlValue(profile.hire_date),
    escapeSqlValue(profile.manager_id),
    escapeSqlValue(profile.contract_type || 'CDI'),
    escapeSqlValue(profile.weekly_hours || 35),
    escapeSqlValue(profile.salary),
    escapeSqlValue(profile.role || 'employee'),
    'NULL', // emergency_contact (JSONB)
    escapeSqlValue(profile.created_at),
    escapeSqlValue(profile.updated_at)
  ];

  sqlScript += `-- Profil ${insertCount}: ${profile.full_name}
INSERT INTO public.profiles (
    id, user_id, tenant_id, full_name, email, phone, avatar_url,
    employee_id, job_title, hire_date, manager_id, contract_type,
    weekly_hours, salary, role, emergency_contact, created_at, updated_at
) VALUES (
    ${values.join(', ')}
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

`;
});

sqlScript += `-- ============================================
-- VÉRIFICATIONS ET STATISTIQUES
-- ============================================

-- Réactiver RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Vérifier la restauration
SELECT 
    COUNT(*) as total_profiles,
    COUNT(DISTINCT tenant_id) as unique_tenants,
    COUNT(DISTINCT role) as unique_roles
FROM public.profiles;

-- Afficher un résumé par tenant
SELECT 
    tenant_id,
    COUNT(*) as profile_count,
    STRING_AGG(DISTINCT role, ', ') as roles
FROM public.profiles
GROUP BY tenant_id
ORDER BY profile_count DESC;

-- Afficher un résumé par rôle
SELECT 
    role,
    COUNT(*) as profile_count
FROM public.profiles
GROUP BY role
ORDER BY profile_count DESC;

-- Restauration complète terminée !
-- ${insertCount} profils restaurés avec succès
-- Date: ${new Date().toISOString()}
`;

// Sauvegarder le script
writeFileSync(
  '/home/awaleh/Documents/Wadashaqeen-SaaS/gantt-flow-next/restore-all-28-profiles-fixed.sql',
  sqlScript,
  'utf8'
);

console.log('\n✅ Script de restauration corrigé généré:');
console.log('   📄 restore-all-28-profiles-fixed.sql');
console.log(`   📊 ${insertCount} profils traités`);
console.log('   🔄 Avec gestion des conflits (ON CONFLICT DO UPDATE)');
console.log('   🛡️ Désactivation/réactivation RLS automatique');
console.log('   📧 Génération automatique d\'emails manquants');

// Statistiques détaillées
const tenantCounts = {};
const roleCounts = {};

exportData.data.forEach(profile => {
  const tenantId = profile.tenant_id || 'NULL';
  const role = profile.role || 'employee';
  
  tenantCounts[tenantId] = (tenantCounts[tenantId] || 0) + 1;
  roleCounts[role] = (roleCounts[role] || 0) + 1;
});

console.log('\n📈 STATISTIQUES DÉTAILLÉES:');
console.log(`   🏢 Tenants uniques: ${Object.keys(tenantCounts).length}`);
console.log(`   👤 Rôles uniques: ${Object.keys(roleCounts).length}`);
console.log(`   📊 Total profils: ${insertCount}`);

console.log('\n🏢 Top 5 tenants par nombre de profils:');
Object.entries(tenantCounts)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 5)
  .forEach(([tenant, count]) => {
    const shortTenant = tenant === 'NULL' ? 'NULL' : tenant.substring(0, 8) + '...';
    console.log(`   - ${shortTenant}: ${count} profil(s)`);
  });

console.log('\n👤 Répartition complète par rôle:');
Object.entries(roleCounts)
  .sort(([,a], [,b]) => b - a)
  .forEach(([role, count]) => {
    console.log(`   - ${role}: ${count} profil(s)`);
  });

console.log('\n🚀 Prêt pour exécution dans Supabase Dashboard !');
console.log('📝 Le script contient des commentaires pour chaque profil');
console.log('🔍 Vérifications automatiques incluses à la fin');
