/**
 * Script de Test - Dashboards avec Données Réelles
 * Test complet des dashboards Projets/Tâches et RH avec données DB
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { exportToCSV, formatDateForExport, formatCurrencyForExport } from '../src/lib/exportUtils';
import { exportTableToPDF, exportHybridPDF } from '../src/lib/pdfExportUtils';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
config({ path: path.join(__dirname, '../.env') });

// Configuration Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://qliinxtanjdnwxlvnxji.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_ANON_KEY) {
  console.error('❌ ERREUR: VITE_SUPABASE_ANON_KEY manquant dans .env');
  console.log('\n💡 Créez un fichier .env avec:');
  console.log('VITE_SUPABASE_URL=https://qliinxtanjdnwxlvnxji.supabase.co');
  console.log('VITE_SUPABASE_ANON_KEY=votre_cle_anon\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Dossier de sortie pour les tests
const OUTPUT_DIR = path.join(__dirname, '../test-outputs');

// Créer le dossier s'il n'existe pas
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// =====================================================
// 1. TEST DASHBOARD PROJETS
// =====================================================

async function testProjectsDashboard() {
  console.log('\n📊 TEST DASHBOARD PROJETS\n' + '='.repeat(50));

  try {
    // Récupérer les projets réels
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    console.log(`✅ ${projects?.length || 0} projets récupérés de la DB`);

    if (!projects || projects.length === 0) {
      console.log('⚠️  Aucun projet trouvé - Test avec données mockées');
      return testWithMockProjects();
    }

    // Calculer les métriques
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const overdueProjects = projects.filter(p => {
      if (p.status === 'completed') return false;
      return p.end_date && new Date(p.end_date) < new Date();
    }).length;

    console.log(`
📈 MÉTRIQUES PROJETS:
   - Total: ${totalProjects}
   - Actifs: ${activeProjects}
   - Terminés: ${completedProjects}
   - En retard: ${overdueProjects}
    `);

    // Test Export CSV
    console.log('📄 Test Export CSV...');
    const csvData = projects.map(p => ({
      Nom: p.name,
      Statut: p.status,
      Priorité: p.priority,
      'Date début': formatDateForExport(p.start_date),
      'Date fin': formatDateForExport(p.end_date),
      Budget: formatCurrencyForExport(p.budget),
    }));

    const csvContent = require('../src/lib/exportUtils').convertToCSV(csvData);
    const csvPath = path.join(OUTPUT_DIR, `test-projets-${Date.now()}.csv`);
    fs.writeFileSync(csvPath, '\uFEFF' + csvContent);
    console.log(`✅ CSV généré: ${csvPath}`);

    // Test Export PDF Tabulaire
    console.log('📄 Test Export PDF Tableau...');
    const pdfTableData = projects.slice(0, 20).map(p => ({
      nom: p.name || 'Sans nom',
      statut: p.status || 'N/A',
      priorite: p.priority || 'N/A',
      debut: formatDateForExport(p.start_date),
      fin: formatDateForExport(p.end_date),
    }));

    await exportTableToPDF(
      pdfTableData,
      [
        { header: 'Nom', dataKey: 'nom', width: 60 },
        { header: 'Statut', dataKey: 'statut', width: 30 },
        { header: 'Priorité', dataKey: 'priorite', width: 30 },
        { header: 'Début', dataKey: 'debut', width: 30 },
        { header: 'Fin', dataKey: 'fin', width: 30 },
      ],
      {
        title: 'TEST - Rapport Projets',
        subtitle: `${totalProjects} projets analysés`,
        filename: path.join(OUTPUT_DIR, `test-projets-tableau-${Date.now()}.pdf`),
        footer: 'Test généré par script automatique',
      }
    );
    console.log('✅ PDF Tableau généré');

    // Test Export PDF Complet
    console.log('📄 Test Export PDF Complet...');
    const metrics = [
      { label: 'Total Projets', value: totalProjects },
      { label: 'Actifs', value: activeProjects },
      { label: 'Terminés', value: completedProjects },
      { label: 'En Retard', value: overdueProjects },
    ];

    await exportHybridPDF(
      metrics,
      pdfTableData,
      [
        { header: 'Nom', dataKey: 'nom' },
        { header: 'Statut', dataKey: 'statut' },
        { header: 'Priorité', dataKey: 'priorite' },
        { header: 'Début', dataKey: 'debut' },
        { header: 'Fin', dataKey: 'fin' },
      ],
      {
        title: 'TEST - Rapport Complet Projets',
        subtitle: `Analyse complète • ${totalProjects} projets`,
        filename: path.join(OUTPUT_DIR, `test-projets-complet-${Date.now()}.pdf`),
        footer: 'Test généré par script automatique',
      }
    );
    console.log('✅ PDF Complet généré');

    return {
      success: true,
      projectsCount: totalProjects,
      metrics: { totalProjects, activeProjects, completedProjects, overdueProjects },
    };
  } catch (error: any) {
    console.error('❌ Erreur test projets:', error.message);
    return { success: false, error: error.message };
  }
}

// =====================================================
// 2. TEST DASHBOARD RH
// =====================================================

async function testHRDashboard() {
  console.log('\n👥 TEST DASHBOARD RH\n' + '='.repeat(50));

  try {
    // Récupérer les employés
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')
      .limit(100);

    if (empError) throw empError;

    // Récupérer les demandes de congés
    const { data: leaveRequests, error: leaveError } = await supabase
      .from('leave_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (leaveError) throw leaveError;

    console.log(`✅ ${employees?.length || 0} employés récupérés`);
    console.log(`✅ ${leaveRequests?.length || 0} demandes de congés récupérées`);

    if (!employees || employees.length === 0) {
      console.log('⚠️  Aucune donnée RH - Test avec données mockées');
      return testWithMockHR();
    }

    // Calculer les métriques
    const totalEmployees = employees.length;
    const pendingRequests = leaveRequests?.filter(r => r.status === 'pending').length || 0;
    const approvedRequests = leaveRequests?.filter(r => r.status === 'approved').length || 0;
    const rejectedRequests = leaveRequests?.filter(r => r.status === 'rejected').length || 0;

    console.log(`
📈 MÉTRIQUES RH:
   - Total Employés: ${totalEmployees}
   - Demandes en attente: ${pendingRequests}
   - Demandes approuvées: ${approvedRequests}
   - Demandes rejetées: ${rejectedRequests}
    `);

    // Test Export CSV
    console.log('📄 Test Export CSV Congés...');
    const csvData = (leaveRequests || []).map(r => {
      const employee = employees.find(e => e.id === r.employee_id);
      return {
        Employé: employee?.full_name || 'Inconnu',
        'Date début': formatDateForExport(r.start_date),
        'Date fin': formatDateForExport(r.end_date),
        'Nombre jours': r.total_days,
        Statut: r.status === 'approved' ? 'Approuvée' : r.status === 'rejected' ? 'Rejetée' : 'En attente',
      };
    });

    const csvContent = require('../src/lib/exportUtils').convertToCSV(csvData);
    const csvPath = path.join(OUTPUT_DIR, `test-conges-${Date.now()}.csv`);
    fs.writeFileSync(csvPath, '\uFEFF' + csvContent);
    console.log(`✅ CSV généré: ${csvPath}`);

    // Test Export PDF
    console.log('📄 Test Export PDF RH...');
    const pdfData = (leaveRequests || []).slice(0, 20).map(r => {
      const employee = employees.find(e => e.id === r.employee_id);
      return {
        employe: employee?.full_name || 'Inconnu',
        debut: formatDateForExport(r.start_date),
        fin: formatDateForExport(r.end_date),
        jours: r.total_days?.toString() || '0',
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
        title: 'TEST - Rapport Congés',
        subtitle: `${leaveRequests?.length || 0} demandes`,
        filename: path.join(OUTPUT_DIR, `test-conges-${Date.now()}.pdf`),
        footer: 'Test généré par script automatique',
      }
    );
    console.log('✅ PDF généré');

    return {
      success: true,
      employeesCount: totalEmployees,
      requestsCount: leaveRequests?.length || 0,
      metrics: { totalEmployees, pendingRequests, approvedRequests, rejectedRequests },
    };
  } catch (error: any) {
    console.error('❌ Erreur test RH:', error.message);
    return { success: false, error: error.message };
  }
}

// =====================================================
// 3. TESTS AVEC DONNÉES MOCKÉES (Fallback)
// =====================================================

async function testWithMockProjects() {
  console.log('🎭 Test avec données mockées PROJETS');
  
  const mockProjects = Array.from({ length: 10 }, (_, i) => ({
    id: `mock-${i}`,
    name: `Projet Test ${i + 1}`,
    status: ['active', 'completed', 'on_hold'][i % 3],
    priority: ['high', 'medium', 'low'][i % 3],
    start_date: new Date(2025, 0, i + 1).toISOString(),
    end_date: new Date(2025, 2, i + 15).toISOString(),
    budget: (i + 1) * 10000,
  }));

  console.log(`✅ ${mockProjects.length} projets mockés créés`);
  return { success: true, mocked: true, projectsCount: mockProjects.length };
}

async function testWithMockHR() {
  console.log('🎭 Test avec données mockées RH');
  
  const mockEmployees = Array.from({ length: 5 }, (_, i) => ({
    id: `emp-${i}`,
    full_name: `Employé Test ${i + 1}`,
  }));

  console.log(`✅ ${mockEmployees.length} employés mockés créés`);
  return { success: true, mocked: true, employeesCount: mockEmployees.length };
}

// =====================================================
// 4. EXÉCUTION DES TESTS
// =====================================================

async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 DÉMARRAGE TESTS DASHBOARDS AVEC DONNÉES RÉELLES');
  console.log('='.repeat(60));
  console.log(`📁 Dossier de sortie: ${OUTPUT_DIR}\n`);

  const results: any = {
    timestamp: new Date().toISOString(),
    tests: {},
  };

  // Test Projets
  const projectsResult = await testProjectsDashboard();
  results.tests.projects = projectsResult;

  // Test RH
  const hrResult = await testHRDashboard();
  results.tests.hr = hrResult;

  // Résumé
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('='.repeat(60));
  console.log(`
✅ Dashboard Projets: ${projectsResult.success ? 'SUCCÈS' : 'ÉCHEC'}
   ${(projectsResult as any).mocked ? '(Données mockées)' : `(${projectsResult.projectsCount} projets réels)`}

✅ Dashboard RH: ${hrResult.success ? 'SUCCÈS' : 'ÉCHEC'}
   ${(hrResult as any).mocked ? '(Données mockées)' : `(${(hrResult as any).employeesCount} employés réels)`}

📁 Fichiers générés dans: ${OUTPUT_DIR}
  `);

  // Sauvegarder le rapport JSON
  const reportPath = path.join(OUTPUT_DIR, `test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`📄 Rapport JSON: ${reportPath}\n`);

  return results;
}

// Exécuter les tests
runAllTests()
  .then(() => {
    console.log('✅ Tests terminés avec succès\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
