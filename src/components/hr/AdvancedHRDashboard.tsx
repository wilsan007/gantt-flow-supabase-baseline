import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdvancedHR } from '@/hooks/useAdvancedHR';
import { useHR } from '@/hooks/useHR';
import { useAlerts } from '@/hooks/useAlerts';
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
  const { alertInstances, getActiveAlerts, getHighPriorityAlerts, initializeAlertData } = useAlerts();
  const [selectedKPI, setSelectedKPI] = useState<'employees' | 'utilization' | 'analytics' | 'alerts' | null>(null);
  const [capacityModalOpen, setCapacityModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [alertsModalOpen, setAlertsModalOpen] = useState(false);

  // États pour la sélection de période
  const [periodStart, setPeriodStart] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [periodEnd, setPeriodEnd] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  });


  if (loading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  // Calculs pour les KPIs RH avancés (synchronisés avec la période sélectionnée)
  const realEmployeeCount = employees.length; // Vrais employés de la base
  const uniqueEmployeesInCapacity = Array.from(new Set(capacityPlanning.map(cp => cp.employee_id))).length;
  const activeAlerts = getActiveAlerts();
  const highPriorityAlerts = getHighPriorityAlerts();
  const highRiskInsights = highPriorityAlerts.length;
  const mediumRiskCount = activeAlerts.filter(alert => alert.severity === 'medium').length;

  // Classement par importance (sévérité > score recommandé > récence)
  const severityWeight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  const sortedActiveAlerts = [...activeAlerts].sort((a: any, b: any) => {
    const aw = severityWeight[a.severity] || 0;
    const bw = severityWeight[b.severity] || 0;
    if (bw !== aw) return bw - aw;
    const aRec = Math.max(...(a.recommendations?.map((r: any) => r.recommended_score || 0) ?? [0]));
    const bRec = Math.max(...(b.recommendations?.map((r: any) => r.recommended_score || 0) ?? [0]));
    if (bRec !== aRec) return bRec - aRec;
    return new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime();
  });
  const topAlerts = sortedActiveAlerts.slice(0, 4);
  const activeAlertsCount = activeAlerts.length;
  
  // Filtrer les données selon la période sélectionnée
  const selectedPeriodRows = capacityPlanning.filter(cp => 
    cp.period_start === periodStart && cp.period_end === periodEnd
  );
  
  // Si aucune donnée pour la période sélectionnée, utiliser les plus récentes
  const latestPeriodStart = capacityPlanning.length
    ? capacityPlanning.reduce((max, cp) => (cp.period_start > max ? cp.period_start : max), capacityPlanning[0].period_start)
    : '';
  const latestRows = selectedPeriodRows.length > 0 
    ? selectedPeriodRows 
    : capacityPlanning.filter((cp) => cp.period_start === latestPeriodStart);
    
  const averageUtilization = latestRows.length > 0
    ? Math.round(latestRows.reduce((sum, cp) => sum + (Number(cp.capacity_utilization) || 0), 0) / latestRows.length)
    : 0;
  // Nombre de métriques RH uniques (par nom + type) pour éviter les doublons
  const uniqueMetricKeys = new Set<string>();
  hrAnalytics.forEach((m) => {
    uniqueMetricKeys.add(`${m.metric_name}__${m.metric_type}`);
  });
  const analyticsCount = uniqueMetricKeys.size;

  // Agrégation de la capacité par employé (moyenne)
  const capAgg = new Map<string, { sum: number; count: number }>();
  (latestRows.length ? latestRows : capacityPlanning).forEach((cp) => {
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
          <Button 
            onClick={async () => {
              await calculateHRMetrics(periodStart, periodEnd);
            }} 
            variant="outline"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Calculer Métriques
          </Button>
          <Button onClick={() => generateEmployeeInsights()} variant="outline">
            <Brain className="h-4 w-4 mr-2" />
            Générer Insights IA
          </Button>
          <Button onClick={initializeAlertData} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Initialiser Alertes
          </Button>
        </div>
      </div>

      {/* Sélection de période */}
      <Card>
        <CardHeader>
          <CardTitle>Période d'analyse</CardTitle>
          <CardDescription>
            Sélectionnez la période pour calculer l'utilisation de capacité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="period-start">Date de début</Label>
              <Input
                id="period-start"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="period-end">Date de fin</Label>
              <Input
                id="period-end"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
            <Button 
              onClick={async () => {
                await calculateHRMetrics(periodStart, periodEnd);
              }}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

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
                  {highPriorityAlerts.slice(0, 3).map((alert) => (
                    <div 
                      key={alert.id} 
                      className="flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-accent/10"
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <AlertTriangle className={`h-4 w-4 ${
                        alert.severity === 'critical' ? 'text-red-500' : 
                        alert.severity === 'high' ? 'text-orange-500' : 
                        alert.severity === 'medium' ? 'text-yellow-500' :
                        'text-green-500'
                      }`} />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{alert.title}</div>
                        <div className="text-xs text-muted-foreground">{alert.entity_name}</div>
                      </div>
                    </div>
                  ))}
                  {highPriorityAlerts.length === 0 && (
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
                  {activeAlerts.slice(0, 4).map((alert) => (
                    <div 
                      key={alert.id} 
                      className="p-3 border rounded-lg cursor-pointer hover:bg-accent/10"
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">{alert.alert_type?.name || alert.title}</span>
                        <Badge variant={
                          alert.severity === 'critical' ? 'destructive' : 
                          alert.severity === 'high' ? 'destructive' : 
                          alert.severity === 'medium' ? 'default' : 
                          'secondary'
                        }>
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{alert.description}</p>
                      {alert.entity_name && (
                        <p className="text-xs text-primary mt-1">📍 {alert.entity_name}</p>
                      )}
                    </div>
                  ))}
                  {activeAlerts.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      <Brain className="h-8 w-8 mx-auto mb-2" />
                      <p>Aucune alerte active détectée</p>
                    </div>
                  )}
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

      {/* Modal Détail Alerte */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${
                selectedAlert?.severity === 'critical' ? 'text-red-500' : 
                selectedAlert?.severity === 'high' ? 'text-orange-500' : 
                selectedAlert?.severity === 'medium' ? 'text-yellow-500' :
                'text-green-500'
              }`} />
              {selectedAlert?.title}
            </DialogTitle>
            <DialogDescription>
              Détails de l'alerte et recommandations d'actions
            </DialogDescription>
          </DialogHeader>
          
          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Sévérité</div>
                  <Badge variant={
                    selectedAlert.severity === 'critical' ? 'destructive' : 
                    selectedAlert.severity === 'high' ? 'destructive' : 
                    selectedAlert.severity === 'medium' ? 'default' : 
                    'secondary'
                  }>
                    {selectedAlert.severity}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Statut</div>
                  <div className="text-sm">{selectedAlert.status}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Entité concernée</div>
                  <div className="text-sm">{selectedAlert.entity_name || 'Non spécifiée'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Déclenché le</div>
                  <div className="text-sm">
                    {new Date(selectedAlert.triggered_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Description</div>
                <p className="text-sm">{selectedAlert.description}</p>
              </div>

              {selectedAlert.recommendations && selectedAlert.recommendations.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Recommandations</div>
                  <div className="space-y-2">
                    {selectedAlert.recommendations.map((rec: any) => (
                      <div key={rec.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium">{rec.solution?.title}</span>
                          {rec.is_primary && (
                            <Badge variant="outline" className="text-xs">Recommandé</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{rec.solution?.description}</p>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Efficacité: {rec.solution?.effectiveness_score}%</span>
                          <span>Délai: {rec.solution?.implementation_time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
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