/**
 * Project Dashboard Analytics - Version améliorée avec analytics
 * Pattern: Stripe/Linear - Analytics épurés et impactants
 */

import React, { useMemo } from 'react';
import { useProjectsEnterprise } from '@/hooks/useProjectsEnterprise';
import { MetricCard } from '@/components/ui/badges';
import { DistributionChart } from '@/components/analytics/DistributionChart';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportToCSV, formatDateForExport, formatCurrencyForExport } from '@/lib/exportUtils';
import { exportTableToPDF, exportDashboardToPDF, exportHybridPDF } from '@/lib/pdfExportUtils';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  RefreshCw,
  FileText,
  Image,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ProjectDashboardAnalytics: React.FC = () => {
  const {
    projects,
    totalCount,
    activeProjects,
    completedProjects,
    overdueProjects,
    loading,
    refresh,
  } = useProjectsEnterprise({});

  const { toast } = useToast();

  // Calculs des métriques avancées
  const analytics = useMemo(() => {
    if (projects.length === 0) {
      return {
        avgDuration: 0,
        statusDistribution: [],
        priorityDistribution: [],
        trends: {
          total: { value: 0, isPositive: true },
          active: { value: 0, isPositive: true },
          completed: { value: 0, isPositive: true },
          overdue: { value: 0, isPositive: false },
        },
      };
    }

    // Durée moyenne des projets (en jours)
    const completedWithDates = projects.filter(
      p => p.status === 'completed' && p.start_date && p.end_date
    );

    const avgDuration =
      completedWithDates.length > 0
        ? Math.round(
            completedWithDates.reduce((sum, p) => {
              const start = new Date(p.start_date!);
              const end = new Date(p.end_date!);
              const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
              return sum + days;
            }, 0) / completedWithDates.length
          )
        : 0;

    // Distribution par statut
    const statusCounts = projects.reduce(
      (acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const statusDistribution = [
      { name: 'Actifs', value: statusCounts.active || 0, color: '#10b981' },
      { name: 'Terminés', value: statusCounts.completed || 0, color: '#3b82f6' },
      { name: 'En pause', value: statusCounts.on_hold || 0, color: '#f59e0b' },
      { name: 'Annulés', value: statusCounts.cancelled || 0, color: '#ef4444' },
    ].filter(item => item.value > 0);

    // Distribution par priorité
    const priorityCounts = projects.reduce(
      (acc, p) => {
        acc[p.priority] = (acc[p.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const priorityDistribution = [
      { name: 'Haute', value: priorityCounts.high || 0, color: '#ef4444' },
      { name: 'Moyenne', value: priorityCounts.medium || 0, color: '#f59e0b' },
      { name: 'Basse', value: priorityCounts.low || 0, color: '#10b981' },
    ].filter(item => item.value > 0);

    // Tendances simulées (à remplacer par vraies données historiques)
    const trends = {
      total: {
        value: 8,
        isPositive: true,
        label: 'vs mois dernier',
      },
      active: {
        value: 12,
        isPositive: true,
        label: 'vs mois dernier',
      },
      completed: {
        value: 15,
        isPositive: true,
        label: 'vs mois dernier',
      },
      overdue: {
        value: 5,
        isPositive: false,
        label: 'vs mois dernier',
      },
    };

    return {
      avgDuration,
      statusDistribution,
      priorityDistribution,
      trends,
    };
  }, [projects]);

  // Export CSV
  const handleExportCSV = () => {
    const exportData = projects.map(p => ({
      Nom: p.name,
      Description: p.description || '',
      Statut: p.status,
      Priorité: p.priority,
      'Date début': formatDateForExport(p.start_date),
      'Date fin': formatDateForExport(p.end_date),
      Progression: p.progress || 0,
      Budget: formatCurrencyForExport(p.budget),
      'Créé par': p.profiles?.full_name || '',
    }));

    exportToCSV(exportData, `projets-${new Date().toISOString().split('T')[0]}.csv`);

    toast({
      title: 'Export CSV réussi',
      description: `${exportData.length} projets exportés`,
    });
  };

  // Export PDF Tabulaire
  const handleExportPDFTable = async () => {
    try {
      const tableData = projects.map(p => ({
        nom: p.name,
        statut: p.status,
        priorite: p.priority,
        debut: formatDateForExport(p.start_date),
        fin: formatDateForExport(p.end_date),
        progression: `${p.progress || 0}%`,
        budget: formatCurrencyForExport(p.budget),
      }));

      await exportTableToPDF(
        tableData,
        [
          { header: 'Nom', dataKey: 'nom', width: 50 },
          { header: 'Statut', dataKey: 'statut', width: 25 },
          { header: 'Priorité', dataKey: 'priorite', width: 25 },
          { header: 'Début', dataKey: 'debut', width: 25 },
          { header: 'Fin', dataKey: 'fin', width: 25 },
          { header: 'Prog.', dataKey: 'progression', width: 20 },
          { header: 'Budget', dataKey: 'budget', width: 30 },
        ],
        {
          title: 'Rapport Projets',
          subtitle: `${totalCount} projets`,
          filename: `projets-${new Date().toISOString().split('T')[0]}.pdf`,
          orientation: 'landscape',
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
      await exportDashboardToPDF('projects-dashboard', {
        title: 'Dashboard Projets',
        filename: `dashboard-projets-${new Date().toISOString().split('T')[0]}.pdf`,
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

  // Export PDF Complet (Métriques + Tableau)
  const handleExportPDFComplete = async () => {
    try {
      const metrics = [
        { label: 'Total Projets', value: totalCount },
        { label: 'Projets Actifs', value: activeProjects },
        { label: 'Projets Terminés', value: completedProjects },
        { label: 'Projets en Retard', value: overdueProjects },
        { label: 'Durée Moyenne', value: `${analytics.avgDuration}j` },
      ];

      const tableData = projects.map(p => ({
        nom: p.name,
        statut: p.status,
        priorite: p.priority,
        debut: formatDateForExport(p.start_date),
        fin: formatDateForExport(p.end_date),
        progression: `${p.progress || 0}%`,
      }));

      await exportHybridPDF(
        metrics,
        tableData,
        [
          { header: 'Nom', dataKey: 'nom' },
          { header: 'Statut', dataKey: 'statut' },
          { header: 'Priorité', dataKey: 'priorite' },
          { header: 'Début', dataKey: 'debut' },
          { header: 'Fin', dataKey: 'fin' },
          { header: 'Progression', dataKey: 'progression' },
        ],
        {
          title: 'Rapport Complet - Projets',
          subtitle: `Analyse détaillée • ${totalCount} projets`,
          filename: `rapport-complet-projets-${new Date().toISOString().split('T')[0]}.pdf`,
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

  return (
    <div className="space-y-6 p-6">
      {/* Header avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Projets</h1>
          <p className="mt-1 text-muted-foreground">Vue d'ensemble et métriques clés</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={projects.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileText className="mr-2 h-4 w-4" />
                CSV (Tableau)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDFTable}>
                <FileText className="mr-2 h-4 w-4" />
                PDF Tableau
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDFDashboard}>
                <Image className="mr-2 h-4 w-4" />
                PDF Visuel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDFComplete}>
                <FileText className="mr-2 h-4 w-4" />
                PDF Complet
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Section à capturer pour PDF visuel */}
      <div id="projects-dashboard" className="space-y-6">
        {/* KPIs avec tendances */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total Projets"
            value={totalCount}
            subtitle={`+${analytics.trends.total.value}% vs précédent`}
            icon={<BarChart3 className="h-6 w-6" />}
            color="blue"
            trend="up"
          />
          <MetricCard
            label="Projets Actifs"
            value={activeProjects}
            subtitle={`+${analytics.trends.active.value}% vs précédent`}
            icon={<TrendingUp className="h-6 w-6" />}
            color="green"
            trend="up"
          />
          <MetricCard
            label="Terminés"
            value={completedProjects}
            subtitle={`+${analytics.trends.completed.value}% vs précédent`}
            icon={<CheckCircle2 className="h-6 w-6" />}
            color="green"
            trend="up"
          />
          <MetricCard
            label="En Retard"
            value={overdueProjects}
            subtitle="Nécessitent action"
            icon={<AlertTriangle className="h-6 w-6" />}
            color="red"
          />
        </div>

        {/* Métrique supplémentaire */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <MetricCard
            label="Durée Moyenne"
            value={`${analytics.avgDuration}j`}
            subtitle="Temps de réalisation"
            icon={<Clock className="h-6 w-6" />}
            color="purple"
          />
        </div>

        {/* Graphiques de distribution */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <DistributionChart title="Distribution par Statut" data={analytics.statusDistribution} />
          <DistributionChart
            title="Distribution par Priorité"
            data={analytics.priorityDistribution}
          />
        </div>
      </div>
      {/* Fin section à capturer */}
    </div>
  );
};
