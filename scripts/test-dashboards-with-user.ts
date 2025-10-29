/**
 * Script de Test - Dashboards avec Utilisateur Spécifique
 * Utilise SERVICE_ROLE_KEY pour contourner RLS et tester avec vraies données
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { exportToCSV, formatDateForExport, formatCurrencyForExport, convertToCSV } from '../src/lib/exportUtils.js';
import { exportTableToPDF, exportHybridPDF } from '../src/lib/pdfExportUtils.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger .env
config({ path: path.join(__dirname, '../.env') });

// Configuration Supabase avec SERVICE ROLE (bypass RLS)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://qliinxtanjdnwxlvnxji.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ ERREUR: SUPABASE_SERVICE_ROLE_KEY manquant dans .env');
  console.log('\n💡 Ajoutez dans .env:');
  console.log('SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key\n');
  process.exit(1);
}

// Client Supabase avec SERVICE ROLE (bypass RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// USER ID spécifique à tester
const TEST_USER_ID = '5c5731ce-75d0-4455-8184-bc42c626cb17';

// Dossier de sortie
const OUTPUT_DIR = path.join(__dirname, '../test-outputs');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// =====================================================
// RÉCUPÉRER LE TENANT DE L'UTILISATEUR
// =====================================================

async function getUserTenant() {
  console.log(`🔍 Recherche du tenant pour user: ${TEST_USER_ID}`);
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('tenant_id, full_name, role')
    .eq('user_id', TEST_USER_ID)
    .single();

  if (error) {
    console.error('❌ Erreur récupération profil:', error.message);
    return null;
  }

  if (!profile?.tenant_id) {
    console.error('❌ Aucun tenant trouvé pour cet utilisateur');
    return null;
  }

  console.log(`✅ Utilisateur: ${profile.full_name}`);
  console.log(`✅ Rôle: ${profile.role}`);
  console.log(`✅ Tenant ID: ${profile.tenant_id}`);

  return profile.tenant_id;
}

// =====================================================
// TEST DASHBOARD PROJETS
// =====================================================

async function testProjectsDashboard(tenantId: string) {
  console.log('\n📊 TEST DASHBOARD PROJETS\n' + '='.repeat(50));

  try {
    // Récupérer les projets du tenant
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`✅ ${projects?.length || 0} projets récupérés`);

    if (!projects || projects.length === 0) {
      console.log('⚠️  Aucun projet - Créez des projets dans l\'application');
      return { success: true, projectsCount: 0, note: 'Pas de données' };
    }

    // Calculer métriques
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const overdueProjects = projects.filter(p => {
      if (p.status === 'completed') return false;
      return p.end_date && new Date(p.end_date) < new Date();
    }).length;

    // Durée moyenne
    const completedWithDates = projects.filter(
      p => p.status === 'completed' && p.start_date && p.end_date
    );
    
    const avgDuration = completedWithDates.length > 0
      ? Math.round(
          completedWithDates.reduce((sum, p) => {
            const start = new Date(p.start_date!);
            const end = new Date(p.end_date!);
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / completedWithDates.length
        )
      : 0;

    console.log(`
📈 MÉTRIQUES CALCULÉES:
   - Total: ${totalProjects}
   - Actifs: ${activeProjects}
   - Terminés: ${completedProjects}
   - En retard: ${overdueProjects}
   - Durée moyenne: ${avgDuration}j
    `);

    // Export CSV
    console.log('📄 Génération CSV...');
    const csvData = projects.map(p => ({
      Nom: p.name || 'Sans nom',
      Description: p.description || '',
      Statut: p.status || 'N/A',
      Priorité: p.priority || 'N/A',
      'Date début': formatDateForExport(p.start_date),
      'Date fin': formatDateForExport(p.end_date),
      Progression: p.progress || 0,
      Budget: formatCurrencyForExport(p.budget),
    }));

    const csvContent = convertToCSV(csvData);
    const csvPath = path.join(OUTPUT_DIR, `projets-${tenantId.substring(0, 8)}-${Date.now()}.csv`);
    fs.writeFileSync(csvPath, '\uFEFF' + csvContent);
    console.log(`✅ CSV: ${path.basename(csvPath)}`);

    // Export PDF Complet
    console.log('📄 Génération PDF Complet...');
    const metrics = [
      { label: 'Total Projets', value: totalProjects },
      { label: 'Actifs', value: activeProjects },
      { label: 'Terminés', value: completedProjects },
      { label: 'En Retard', value: overdueProjects },
      { label: 'Durée Moyenne', value: `${avgDuration}j` },
    ];

    const pdfData = projects.slice(0, 20).map(p => ({
      nom: p.name || 'Sans nom',
      statut: p.status || 'N/A',
      priorite: p.priority || 'N/A',
      debut: formatDateForExport(p.start_date),
      fin: formatDateForExport(p.end_date),
      progression: `${p.progress || 0}%`,
    }));

    await exportHybridPDF(
      metrics,
      pdfData,
      [
        { header: 'Nom', dataKey: 'nom' },
        { header: 'Statut', dataKey: 'statut' },
        { header: 'Priorité', dataKey: 'priorite' },
        { header: 'Début', dataKey: 'debut' },
        { header: 'Fin', dataKey: 'fin' },
        { header: 'Prog.', dataKey: 'progression' },
      ],
      {
        title: 'TEST RÉEL - Rapport Projets',
        subtitle: `Données utilisateur réel • ${totalProjects} projets`,
        filename: path.join(OUTPUT_DIR, `projets-complet-${tenantId.substring(0, 8)}-${Date.now()}.pdf`),
        footer: `Test avec user ${TEST_USER_ID.substring(0, 8)}...`,
      }
    );
    console.log('✅ PDF Complet généré');

    return {
      success: true,
      projectsCount: totalProjects,
      metrics: { totalProjects, activeProjects, completedProjects, overdueProjects, avgDuration },
    };

  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    return { success: false, error: error.message };
  }
}

// =====================================================
// TEST DASHBOARD RH
// =====================================================

async function testHRDashboard(tenantId: string) {
  console.log('\n👥 TEST DASHBOARD RH\n' + '='.repeat(50));

  try {
    // Récupérer employés
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('tenant_id', tenantId);

    if (empError) throw empError;

    // Récupérer congés
    const { data: leaveRequests, error: leaveError } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (leaveError) throw leaveError;

    console.log(`✅ ${employees?.length || 0} employés`);
    console.log(`✅ ${leaveRequests?.length || 0} demandes de congés`);

    if (!employees || employees.length === 0) {
      console.log('⚠️  Aucun employé - Module RH non utilisé');
      return { success: true, employeesCount: 0, note: 'Pas de données RH' };
    }

    // Calculer métriques
    const totalEmployees = employees.length;
    const pendingRequests = leaveRequests?.filter(r => r.status === 'pending').length || 0;
    const approvedRequests = leaveRequests?.filter(r => r.status === 'approved').length || 0;

    console.log(`
📈 MÉTRIQUES RH:
   - Total Employés: ${totalEmployees}
   - Demandes en attente: ${pendingRequests}
   - Demandes approuvées: ${approvedRequests}
    `);

    // Export CSV
    console.log('📄 Génération CSV Congés...');
    const csvData = (leaveRequests || []).map(r => {
      const employee = employees.find(e => e.user_id === r.employee_id);
      return {
        Employé: employee?.full_name || 'Inconnu',
        'Date début': formatDateForExport(r.start_date),
        'Date fin': formatDateForExport(r.end_date),
        'Nombre jours': r.total_days || 0,
        Statut: r.status === 'approved' ? 'Approuvée' : r.status === 'rejected' ? 'Rejetée' : 'En attente',
        Raison: r.reason || '',
      };
    });

    const csvContent = convertToCSV(csvData);
    const csvPath = path.join(OUTPUT_DIR, `conges-${tenantId.substring(0, 8)}-${Date.now()}.csv`);
    fs.writeFileSync(csvPath, '\uFEFF' + csvContent);
    console.log(`✅ CSV: ${path.basename(csvPath)}`);

    // Export PDF
    if (leaveRequests && leaveRequests.length > 0) {
      console.log('📄 Génération PDF RH...');
      const pdfData = leaveRequests.slice(0, 20).map(r => {
        const employee = employees.find(e => e.user_id === r.employee_id);
        return {
          employe: employee?.full_name || 'Inconnu',
          debut: formatDateForExport(r.start_date),
          fin: formatDateForExport(r.end_date),
          jours: (r.total_days || 0).toString(),
          statut: r.status === 'approved' ? 'Approuvée' : r.status === 'rejected' ? 'Rejetée' : 'En attente',
        };
      });

      await exportTableToPDF(
        pdfData,
        [
          { header: 'Employé', dataKey: 'employe', width: 50 },
          { header: 'Début', dataKey: 'debut', width: 30 },
          { header: 'Fin', dataKey: 'fin', width: 30 },
          { header: 'Jours', dataKey: 'jours', width: 20 },
          { header: 'Statut', dataKey: 'statut', width: 35 },
        ],
        {
          title: 'TEST RÉEL - Rapport Congés',
          subtitle: `Données utilisateur réel • ${leaveRequests.length} demandes`,
          filename: path.join(OUTPUT_DIR, `conges-${tenantId.substring(0, 8)}-${Date.now()}.pdf`),
          footer: `Test avec user ${TEST_USER_ID.substring(0, 8)}...`,
        }
      );
      console.log('✅ PDF généré');
    }

    return {
      success: true,
      employeesCount: totalEmployees,
      requestsCount: leaveRequests?.length || 0,
      metrics: { totalEmployees, pendingRequests, approvedRequests },
    };

  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    return { success: false, error: error.message };
  }
}

// =====================================================
// EXÉCUTION
// =====================================================

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TEST DASHBOARDS AVEC UTILISATEUR RÉEL');
  console.log('='.repeat(60));
  console.log(`👤 User ID: ${TEST_USER_ID}`);
  console.log(`📁 Outputs: ${OUTPUT_DIR}\n`);

  // 1. Récupérer tenant
  const tenantId = await getUserTenant();
  if (!tenantId) {
    console.error('\n❌ Impossible de continuer sans tenant');
    process.exit(1);
  }

  const results: any = {
    timestamp: new Date().toISOString(),
    userId: TEST_USER_ID,
    tenantId,
    tests: {},
  };

  // 2. Test Projets
  const projectsResult = await testProjectsDashboard(tenantId);
  results.tests.projects = projectsResult;

  // 3. Test RH
  const hrResult = await testHRDashboard(tenantId);
  results.tests.hr = hrResult;

  // 4. Résumé
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ DES TESTS RÉELS');
  console.log('='.repeat(60));
  console.log(`
✅ Dashboard Projets: ${projectsResult.success ? 'SUCCÈS' : 'ÉCHEC'}
   ${projectsResult.projectsCount} projets trouvés
   ${projectsResult.metrics ? `Métriques calculées: ${JSON.stringify(projectsResult.metrics, null, 2)}` : ''}

✅ Dashboard RH: ${hrResult.success ? 'SUCCÈS' : 'ÉCHEC'}
   ${(hrResult as any).employeesCount || 0} employés trouvés
   ${(hrResult as any).requestsCount || 0} demandes de congés

📁 Fichiers générés dans: ${OUTPUT_DIR}
  `);

  // 5. Rapport JSON
  const reportPath = path.join(OUTPUT_DIR, `test-report-real-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`📄 Rapport détaillé: ${path.basename(reportPath)}\n`);

  // 6. Liste des fichiers
  const files = fs.readdirSync(OUTPUT_DIR)
    .filter(f => f.includes(tenantId.substring(0, 8)))
    .sort();
  
  console.log('📋 Fichiers générés:');
  files.forEach(f => console.log(`   - ${f}`));

  return results;
}

// Exécuter
runTests()
  .then(() => {
    console.log('\n✅ Tests terminés avec succès\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
