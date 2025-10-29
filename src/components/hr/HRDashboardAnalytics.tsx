/**
 * HR Dashboard Analytics - Version améliorée avec analytics
 * Pattern: BambooHR/Factorial - Analytics RH épurés
 */

import React, { useMemo } from 'react';
import { useHRMinimal } from '@/hooks/useHRMinimal';
import { MetricCard } from '@/components/ui/badges';
import { AbsenceCalendar } from '@/components/analytics/AbsenceCalendar';
import { DistributionChart } from '@/components/analytics/DistributionChart';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportToCSV, formatDateForExport } from '@/lib/exportUtils';
import { exportTableToPDF, exportDashboardToPDF, exportHybridPDF } from '@/lib/pdfExportUtils';
import { 
  Users, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Calendar,
  Download,
  RefreshCw,
  FileText,
  Image
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const HRDashboardAnalytics: React.FC = () => {
  const {
    employees,
    leaveRequests,
    attendances,
    loading,
    error,
    refresh,
  } = useHRMinimal();

  const { toast } = useToast();

  // Calculs des métriques avancées
  const analytics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    // Statistiques de base
    const pendingRequests = leaveRequests.filter((r) => r.status === 'pending').length;
    const approvedRequests = leaveRequests.filter((r) => r.status === 'approved').length;
    const todayAttendances = attendances.filter((a) => a.date === today).length;

    // Temps moyen d'approbation
    const approvedWithDates = leaveRequests.filter(
      (r) => r.status === 'approved' && r.created_at && r.updated_at
    );

    const avgApprovalTime = approvedWithDates.length > 0
      ? Math.round(
          approvedWithDates.reduce((sum, r) => {
            const created = new Date(r.created_at!);
            const updated = new Date(r.updated_at!);
            const hours = (updated.getTime() - created.getTime()) / (1000 * 60 * 60);
            return sum + hours;
          }, 0) / approvedWithDates.length / 24
        )
      : 0;

    // Distribution par type de congé
    const typeCounts = leaveRequests
      .filter((r) => r.status === 'approved')
      .reduce((acc, r) => {
        const type = r.absence_type_id || 'Autre';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const typeDistribution = Object.entries(typeCounts).map(([name, value]) => ({
      name,
      value,
    }));

    // Distribution par statut
    const statusCounts = leaveRequests.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusDistribution = [
      { name: 'En attente', value: statusCounts.pending || 0, color: '#f59e0b' },
      { name: 'Approuvées', value: statusCounts.approved || 0, color: '#10b981' },
      { name: 'Rejetées', value: statusCounts.rejected || 0, color: '#ef4444' },
    ].filter((item) => item.value > 0);

    // Préparer les absences pour le calendrier
    const calendarAbsences = leaveRequests
      .filter((r) => r.status === 'approved')
      .map((r) => {
        const employee = employees.find((e) => e.user_id === r.employee_id);
        return {
          id: r.id,
          employee_name: employee?.full_name || 'Inconnu',
          start_date: r.start_date,
          end_date: r.end_date,
          status: r.status as 'pending' | 'approved' | 'rejected',
          type: String(r.absence_type_id || 'Autre'),
        };
      });

    // Tendances simulées
    const trends = {
      employees: { value: 5, isPositive: true, label: 'vs mois dernier' },
      pending: { value: 10, isPositive: false, label: 'vs semaine dernière' },
      approved: { value: 8, isPositive: true, label: 'vs mois dernier' },
      attendances: { value: 3, isPositive: true, label: 'vs hier' },
    };

    return {
      pendingRequests,
      approvedRequests,
      todayAttendances,
      avgApprovalTime,
      statusDistribution,
      typeDistribution,
      calendarAbsences,
      trends,
    };
  }, [employees, leaveRequests, attendances]);

  // Export CSV
  const handleExportCSV = () => {
    const exportData = leaveRequests.map((r) => {
      const employee = employees.find((e) => e.user_id === r.employee_id);
      return {
        Employé: employee?.full_name || 'Inconnu',
        'Date début': formatDateForExport(r.start_date),
        'Date fin': formatDateForExport(r.end_date),
        'Nombre de jours': r.total_days,
        Statut: r.status === 'approved' ? 'Approuvée' : r.status === 'rejected' ? 'Rejetée' : 'En attente',
        Raison: r.reason || '',
        'Créé le': formatDateForExport(r.created_at),
      };
    });

    exportToCSV(exportData, `conges-${new Date().toISOString().split('T')[0]}.csv`);
    
    toast({
      title: 'Export CSV réussi',
      description: `${exportData.length} demandes exportées`,
    });
  };

  // Export PDF Tabulaire
  const handleExportPDFTable = async () => {
    try {
      const tableData = leaveRequests.map((r) => {
        const employee = employees.find((e) => e.user_id === r.employee_id);
        return {
          employe: employee?.full_name || 'Inconnu',
          debut: formatDateForExport(r.start_date),
          fin: formatDateForExport(r.end_date),
          jours: r.total_days.toString(),
          statut: r.status === 'approved' ? 'Approuvée' : r.status === 'rejected' ? 'Rejetée' : 'En attente',
        };
      });

      await exportTableToPDF(
        tableData,
        [
          { header: 'Employé', dataKey: 'employe', width: 50 },
          { header: 'Début', dataKey: 'debut', width: 30 },
          { header: 'Fin', dataKey: 'fin', width: 30 },
          { header: 'Jours', dataKey: 'jours', width: 20 },
          { header: 'Statut', dataKey: 'statut', width: 35 },
        ],
        {
          title: 'Rapport Congés',
          subtitle: `${leaveRequests.length} demandes`,
          filename: `conges-${new Date().toISOString().split('T')[0]}.pdf`,
          footer: 'Généré par Wadashaqeen SaaS',
        }
      );

      toast({
        title: 'Export PDF réussi',
        description: 'Rapport tabulaire téléchargé',
      });
    } catch (error) {
      toast({
        title: 'Erreur export PDF',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  };

  // Export PDF Visuel (Dashboard)
  const handleExportPDFDashboard = async () => {
    try {
      await exportDashboardToPDF('hr-dashboard', {
        title: 'Dashboard RH',
        filename: `dashboard-rh-${new Date().toISOString().split('T')[0]}.pdf`,
        orientation: 'landscape',
      });

      toast({
        title: 'Export PDF réussi',
        description: 'Dashboard visuel téléchargé',
      });
    } catch (error) {
      toast({
        title: 'Erreur export PDF',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  };

  // Export PDF Complet
  const handleExportPDFComplete = async () => {
    try {
      const metrics = [
        { label: 'Total Employés', value: employees.length },
        { label: 'Demandes en Attente', value: analytics.pendingRequests },
        { label: 'Demandes Approuvées', value: analytics.approvedRequests },
        { label: 'Présences Aujourd\'hui', value: analytics.todayAttendances },
        { label: 'Délai Approbation', value: `${analytics.avgApprovalTime}j` },
      ];

      const tableData = leaveRequests.slice(0, 20).map((r) => {
        const employee = employees.find((e) => e.user_id === r.employee_id);
        return {
          employe: employee?.full_name || 'Inconnu',
          debut: formatDateForExport(r.start_date),
          fin: formatDateForExport(r.end_date),
          jours: r.total_days.toString(),
          statut: r.status === 'approved' ? 'Approuvée' : r.status === 'rejected' ? 'Rejetée' : 'En attente',
        };
      });

      await exportHybridPDF(
        metrics,
        tableData,
        [
          { header: 'Employé', dataKey: 'employe' },
          { header: 'Début', dataKey: 'debut' },
          { header: 'Fin', dataKey: 'fin' },
          { header: 'Jours', dataKey: 'jours' },
          { header: 'Statut', dataKey: 'statut' },
        ],
        {
          title: 'Rapport Complet - RH',
          subtitle: `Analyse détaillée • ${leaveRequests.length} demandes`,
          filename: `rapport-complet-rh-${new Date().toISOString().split('T')[0]}.pdf`,
          footer: 'Généré par Wadashaqeen SaaS',
        }
      );

      toast({
        title: 'Export PDF complet réussi',
        description: 'Rapport avec métriques + données téléchargé',
      });
    } catch (error) {
      toast({
        title: 'Erreur export PDF',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          Erreur: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics RH</h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble et métriques clés
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={leaveRequests.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileText className="h-4 w-4 mr-2" />
                CSV (Tableau)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDFTable}>
                <FileText className="h-4 w-4 mr-2" />
                PDF Tableau
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDFDashboard}>
                <Image className="h-4 w-4 mr-2" />
                PDF Visuel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDFComplete}>
                <FileText className="h-4 w-4 mr-2" />
                PDF Complet
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Section à capturer pour PDF visuel */}
      <div id="hr-dashboard" className="space-y-6">
        {/* KPIs avec tendances */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Employés"
          value={employees.length}
          subtitle={`+${analytics.trends.employees.value}% ${analytics.trends.employees.label}`}
          icon={<Users className="w-6 h-6" />}
          color="blue"
          trend="up"
        />
        <MetricCard
          label="En Attente"
          value={analytics.pendingRequests}
          subtitle="Demandes à traiter"
          icon={<AlertCircle className="w-6 h-6" />}
          color="orange"
        />
        <MetricCard
          label="Approuvées"
          value={analytics.approvedRequests}
          subtitle={`+${analytics.trends.approved.value}% ${analytics.trends.approved.label}`}
          icon={<CheckCircle className="w-6 h-6" />}
          color="green"
          trend="up"
        />
        <MetricCard
          label="Présences"
          value={analytics.todayAttendances}
          subtitle="Aujourd'hui"
          icon={<Clock className="w-6 h-6" />}
          color="blue"
        />
        </div>

        {/* Métrique supplémentaire */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Délai Moyen"
          value={`${analytics.avgApprovalTime}j`}
          subtitle="Temps d'approbation"
          icon={<Calendar className="w-6 h-6" />}
          color="purple"
        />
        </div>

        {/* Calendrier des absences */}
        <AbsenceCalendar absences={analytics.calendarAbsences} />

        {/* Graphique de distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DistributionChart
          title="Distribution par Statut"
          data={analytics.statusDistribution}
        />
        {analytics.typeDistribution.length > 0 && (
          <DistributionChart
            title="Distribution par Type de Congé"
            data={analytics.typeDistribution}
          />
        )}
        </div>
      </div>
      {/* Fin section à capturer */}
    </div>
  );
};
