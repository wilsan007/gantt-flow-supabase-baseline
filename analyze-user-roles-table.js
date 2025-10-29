import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Debug: Afficher les variables d'environnement
console.log('URL:', process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL ? 'Défini ✅' : 'Non défini ❌');
console.log('Service Role Key (VITE_):', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? 'Défini ✅' : 'Non défini ❌');
console.log('Service Role Key (sans VITE_):', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Défini ✅' : 'Non défini ❌');
console.log('Anon Key:', process.env.VITE_SUPABASE_ANON_KEY ? 'Défini ✅' : 'Non défini ❌');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes!');
  console.error('Vérifiez votre fichier .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeUserRoles() {
  console.log('\n🔍 ANALYSE DE LA TABLE user_roles\n');
  console.log('═'.repeat(80));
  
  // 1. Compter le nombre total de lignes
  const { data: allData, error: countError, count: totalCount } = await supabase
    .from('user_roles')
    .select('*', { count: 'exact' });
  
  if (countError) {
    console.error('❌ Erreur lors du comptage:', countError);
    return;
  }
  
  console.log('\n📊 STATISTIQUES GLOBALES:');
  console.log('─'.repeat(80));
  console.log(`Nombre total de lignes: ${totalCount || allData?.length || 0}`);
  
  // 2. Compter les utilisateurs uniques
  const { data: uniqueUsers, error: usersError } = await supabase
    .from('user_roles')
    .select('user_id');
  
  if (usersError) {
    console.error('❌ Erreur lors de la récupération des utilisateurs:', usersError);
    return;
  }
  
  const uniqueUserIds = [...new Set(uniqueUsers.map(u => u.user_id))];
  console.log(`Nombre d'utilisateurs uniques: ${uniqueUserIds.length}`);
  console.log(`Moyenne de rôles par utilisateur: ${(totalCount / uniqueUserIds.length).toFixed(2)}`);
  
  // 3. Trouver les utilisateurs avec le plus de rôles
  const { data: allRoles } = await supabase
    .from('user_roles')
    .select(`
      id,
      user_id,
      role_id,
      is_active,
      tenant_id,
      created_at,
      roles!inner(name, display_name)
    `)
    .order('created_at', { ascending: false });
  
  // Grouper par user_id
  const userRolesMap = {};
  allRoles.forEach(role => {
    if (!userRolesMap[role.user_id]) {
      userRolesMap[role.user_id] = [];
    }
    userRolesMap[role.user_id].push(role);
  });
  
  // Trier par nombre de rôles
  const sortedUsers = Object.entries(userRolesMap)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10);
  
  console.log('\n👥 TOP 10 UTILISATEURS AVEC LE PLUS DE RÔLES:');
  console.log('─'.repeat(80));
  
  for (const [userId, roles] of sortedUsers) {
    console.log(`\n🔹 User ID: ${userId}`);
    console.log(`   Nombre de rôles: ${roles.length}`);
    console.log(`   Rôles actifs: ${roles.filter(r => r.is_active).length}`);
    console.log(`   Rôles inactifs: ${roles.filter(r => !r.is_active).length}`);
    console.log(`   Tenants: ${[...new Set(roles.map(r => r.tenant_id))].length}`);
    console.log('   Détail des rôles:');
    
    roles.forEach((role, idx) => {
      const status = role.is_active ? '✅' : '❌';
      const date = new Date(role.created_at).toLocaleDateString('fr-FR');
      console.log(`     ${idx + 1}. ${status} ${role.roles.name} (${role.roles.display_name}) - ${date}`);
    });
  }
  
  // 4. Analyser les doublons potentiels
  console.log('\n\n🔍 ANALYSE DES DOUBLONS:');
  console.log('─'.repeat(80));
  
  const duplicates = [];
  for (const [userId, roles] of Object.entries(userRolesMap)) {
    // Grouper par role_id et tenant_id
    const roleGroups = {};
    roles.forEach(role => {
      const key = `${role.role_id}_${role.tenant_id}`;
      if (!roleGroups[key]) {
        roleGroups[key] = [];
      }
      roleGroups[key].push(role);
    });
    
    // Trouver les doublons (même rôle + même tenant)
    for (const [key, group] of Object.entries(roleGroups)) {
      if (group.length > 1) {
        duplicates.push({
          userId,
          roleName: group[0].roles.name,
          tenantId: group[0].tenant_id,
          count: group.length,
          entries: group
        });
      }
    }
  }
  
  if (duplicates.length > 0) {
    console.log(`\n⚠️  DOUBLONS DÉTECTÉS: ${duplicates.length} cas\n`);
    
    duplicates.slice(0, 5).forEach((dup, idx) => {
      console.log(`${idx + 1}. User: ${dup.userId.substring(0, 8)}...`);
      console.log(`   Rôle: ${dup.roleName}`);
      console.log(`   Tenant: ${dup.tenantId ? dup.tenantId.substring(0, 8) + '...' : 'NULL'}`);
      console.log(`   Nombre d'entrées: ${dup.count}`);
      console.log('   Détail:');
      dup.entries.forEach((entry, i) => {
        const status = entry.is_active ? '✅ ACTIF' : '❌ INACTIF';
        const date = new Date(entry.created_at).toISOString();
        console.log(`     - ID: ${entry.id.substring(0, 8)}... | ${status} | Créé: ${date}`);
      });
      console.log('');
    });
  } else {
    console.log('✅ Aucun doublon détecté');
  }
  
  // 5. Analyser les rôles inactifs
  const inactiveRoles = allRoles.filter(r => !r.is_active);
  console.log('\n\n📉 RÔLES INACTIFS:');
  console.log('─'.repeat(80));
  console.log(`Nombre total de rôles inactifs: ${inactiveRoles.length}`);
  console.log(`Pourcentage: ${((inactiveRoles.length / totalCount) * 100).toFixed(2)}%`);
  
  console.log('\n' + '═'.repeat(80));
}

analyzeUserRoles().catch(console.error);
