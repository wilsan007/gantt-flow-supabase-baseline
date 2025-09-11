import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useAdvancedHR } from '@/hooks/useAdvancedHR';
import { useHR } from '@/hooks/useHR';
import { KPIDetailDialog } from './KPIDetailDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  Building2, 
  Target,
  Brain,
  BarChart3,
  Globe,
  Plus
} from 'lucide-react';

export const AdvancedHRDashboard = () => {
  const {
    capacityPlanning,
    jobPosts,
    candidates,
    jobApplications,
    interviews,
    jobOffers,
    employeeInsights,
    hrAnalytics,
    countryPolicies,
    loading,
    generateEmployeeInsights,
    calculateHRMetrics
  } = useAdvancedHR();

  const { employees } = useHR();
  const [selectedKPI, setSelectedKPI] = useState<'employees' | 'utilization' | 'analytics' | 'alerts' | null>(null);
  const [capacityModalOpen, setCapacityModalOpen] = useState(false);

  if (loading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  // Calculs pour les KPIs RH avancés (corrigés)
  const realEmployeeCount = employees.length; // Vrais employés de la base
  const uniqueEmployeesInCapacity = Array.from(new Set(capacityPlanning.map(cp => cp.employee_id))).length;
  const highRiskInsights = employeeInsights.filter(insight => insight.risk_level === 'high' || insight.risk_level === 'critical').length;
  const mediumRiskCount = employeeInsights.filter(insight => insight.risk_level === 'medium').length;
  const averageUtilization = capacityPlanning.length > 0 
    ? Math.round(
        capacityPlanning.reduce((sum, cp) => sum + (Number(cp.capacity_utilization) || 0), 0) / capacityPlanning.length
      )
    : 0;
  // Nombre de métriques RH uniques (par nom + type) pour éviter les doublons
  const uniqueMetricKeys = new Set<string>();
  hrAnalytics.forEach((m) => {
    uniqueMetricKeys.add(`${m.metric_name}__${m.metric_type}`);
  });
  const analyticsCount = uniqueMetricKeys.size;

  // Agrégation de la capacité par employé (moyenne)
  const capAgg = new Map<string, { sum: number; count: number }>();
  capacityPlanning.forEach((cp) => {
    const util = Number(cp.capacity_utilization) || 0;
    const prev = capAgg.get(cp.employee_id) || { sum: 0, count: 0 };
    capAgg.set(cp.employee_id, { sum: prev.sum + util, count: prev.count + 1 });
  });
  const perEmployeeUtilization = Array.from(capAgg.entries()).map(([employee_id, { sum, count }]) => {
    const avg = count ? Math.round(sum / count) : 0;
    const emp = employees.find((e) => e.id === employee_id);
    return {
      employee_id,
      full_name: emp?.full_name || `Employé ${employee_id.slice(0, 8)}...`,
      avgUtilization: avg,
    };
  });
  // Top 3 les plus élevés et Bottom 2 les plus faibles
  const sortedDesc = [...perEmployeeUtilization].sort((a, b) => b.avgUtilization - a.avgUtilization);
  const sortedAsc = [...perEmployeeUtilization].sort((a, b) => a.avgUtilization - b.avgUtilization);
  const top3 = sortedDesc.slice(0, 3);
  const bottom2 = sortedAsc.slice(0, 2);
  const selectedEmployees: { employee_id: string; full_name: string; avgUtilization: number }[] = [];
  const seen = new Set<string>();
  [...top3, ...bottom2].forEach((e) => {
    if (!seen.has(e.employee_id)) {
      seen.add(e.employee_id);
      selectedEmployees.push(e);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Tableau de Bord RH Avancé</h2>
          <p className="text-muted-foreground">
            Planification capacité, analyses IA et métriques RH
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={calculateHRMetrics} variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Calculer Métriques
          </Button>
          <Button onClick={() => generateEmployeeInsights()} variant="outline">
            <Brain className="h-4 w-4 mr-2" />
            Générer Insights IA
          </Button>
        </div>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className="modern-card hover-glow cursor-pointer transition-all hover:scale-105"
          onClick={() => setSelectedKPI('employees')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employés Actifs</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{realEmployeeCount}</div>
            <p className="text-xs text-muted-foreground">
              Employés réels enregistrés
            </p>
          </CardContent>
        </Card>

        <Card 
          className="modern-card hover-glow cursor-pointer transition-all hover:scale-105"
          onClick={() => setSelectedKPI('utilization')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisation Capacité</CardTitle>
            <Target className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{averageUtilization}%</div>
            <p className="text-xs text-muted-foreground">
              Taux d'utilisation moyen
            </p>
          </CardContent>
        </Card>

        <Card 
          className="modern-card hover-glow cursor-pointer transition-all hover:scale-105"
          onClick={() => setSelectedKPI('analytics')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Métriques RH</CardTitle>
            <BarChart3 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{analyticsCount}</div>
            <p className="text-xs text-muted-foreground">
              Indicateurs calculés
            </p>
          </CardContent>
        </Card>

        <Card 
          className="modern-card hover-glow cursor-pointer transition-all hover:scale-105"
          onClick={() => setSelectedKPI('alerts')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes IA</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{highRiskInsights}</div>
            <p className="text-xs text-muted-foreground">
              Risques détectés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs pour les différents modules */}
      <Tabs defaultValue="capacity" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="capacity">Capacité</TabsTrigger>
          <TabsTrigger value="ai-insights">IA Insights</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Onglet Capacité & Planification */}
        <TabsContent value="capacity" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader onClick={() => setCapacityModalOpen(true)} className="cursor-pointer">
                <CardTitle>Vue Capacité vs Charge</CardTitle>
                <CardDescription>
                  Analyse des ressources et planification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedEmployees.map((item) => (
                    <div key={item.employee_id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{item.full_name}</span>
                        <span>{item.avgUtilization}%</span>
                      </div>
                      <Progress value={item.avgUtilization} className="h-2" />
                    </div>
                  ))}
                  {selectedEmployees.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      Aucune donnée de planification de capacité disponible
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertes Proactives</CardTitle>
                <CardDescription>
                  Détection automatique des surcharges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {employeeInsights.filter(insight => insight.risk_level === 'high' || insight.risk_level === 'medium').slice(0, 3).map((insight) => (
                    <div key={insight.id} className="flex items-center space-x-2">
                      <AlertTriangle className={`h-4 w-4 ${
                        insight.risk_level === 'high' ? 'text-red-500' : 
                        insight.risk_level === 'medium' ? 'text-orange-500' : 
                        'text-green-500'
                      }`} />
                      <span className="text-sm">{insight.description}</span>
                    </div>
                  ))}
                  {employeeInsights.filter(insight => insight.risk_level === 'high' || insight.risk_level === 'medium').length === 0 && (
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Aucune alerte détectée - Situation optimale</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>


        {/* Onglet IA Insights */}
        <TabsContent value="ai-insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>People Assistant IA</CardTitle>
                <CardDescription>
                  Analyses intelligentes et prédictions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Risques d'Attrition</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      Détection basée sur signaux faibles (absences, performance, charge)
                    </p>
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">{mediumRiskCount} employé{mediumRiskCount > 1 ? 's' : ''} à risque moyen</span>
                    </div>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Assistant Timesheet</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      Remplissage automatique depuis planning projets
                    </p>
                    <Button size="sm" variant="outline">
                      <Brain className="h-4 w-4 mr-2" />
                      Auto-compléter
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Insights Employés</CardTitle>
                <CardDescription>
                  Analyses individuelles et recommandations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {employeeInsights.slice(0, 4).map((insight) => (
                    <div key={insight.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">{insight.insight_type}</span>
                        <Badge variant={
                          insight.risk_level === 'high' ? 'destructive' : 
                          insight.risk_level === 'medium' ? 'default' : 
                          'secondary'
                        }>
                          {insight.risk_level}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{insight.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>KPIs Différenciants</CardTitle>
                <CardDescription>
                  Métriques avancées et tendances
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {hrAnalytics.slice(0, 4).map((metric) => (
                    <div key={metric.id} className="flex justify-between items-center">
                      <span className="text-sm">{metric.metric_name}</span>
                      <span className="text-sm font-medium">{metric.metric_value}</span>
                    </div>
                  ))}
                  {hrAnalytics.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      Aucune métrique calculée disponible
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Qualité Process</CardTitle>
                <CardDescription>
                  Délais moyens d'approbation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {hrAnalytics.filter(metric => metric.metric_type === 'process_time').slice(0, 3).map((metric) => (
                    <div key={metric.id} className="flex justify-between items-center">
                      <span className="text-sm">{metric.metric_name}</span>
                      <span className="text-sm font-medium">{metric.metric_value} jours</span>
                    </div>
                  ))}
                  {hrAnalytics.filter(metric => metric.metric_type === 'process_time').length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      Aucune métrique de processus disponible
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Corrélations IA</CardTitle>
                <CardDescription>
                  Performance vs charge/absences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {employeeInsights.filter(insight => insight.insight_type === 'correlation').slice(0, 2).map((insight) => (
                    <div key={insight.id} className="p-3 border rounded-lg">
                      <span className="text-sm font-medium">{insight.description}</span>
                      {insight.recommendations && (
                        <p className="text-xs text-muted-foreground">
                          {insight.recommendations}
                        </p>
                      )}
                    </div>
                  ))}
                  {employeeInsights.filter(insight => insight.insight_type === 'correlation').length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      <Brain className="h-8 w-8 mx-auto mb-2" />
                      <p>Aucune corrélation IA détectée</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>

      {/* Modal Vue Capacité Vs Charge */}
      <Dialog open={capacityModalOpen} onOpenChange={setCapacityModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vue Capacité vs Charge</DialogTitle>
            <DialogDescription>Liste de tous les employés avec leur utilisation moyenne</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {perEmployeeUtilization.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                Aucune donnée de planification de capacité disponible
              </div>
            ) : (
              [...perEmployeeUtilization]
                .sort((a, b) => b.avgUtilization - a.avgUtilization)
                .map((item) => (
                  <div key={item.employee_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="font-medium">{item.full_name}</div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{item.avgUtilization}%</div>
                      <Progress value={item.avgUtilization} className="w-32 h-2" />
                    </div>
                  </div>
                ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog pour les détails des KPI */}
      <KPIDetailDialog 
        open={selectedKPI !== null}
        onOpenChange={(open) => !open && setSelectedKPI(null)}
        kpiType={selectedKPI}
      />
    </div>
  );
};