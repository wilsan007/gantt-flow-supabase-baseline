import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useAdvancedHR } from '@/hooks/useAdvancedHR';
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

  if (loading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  // Calculs pour les KPIs RH avancés
  const totalEmployees = capacityPlanning.length;
  const highRiskInsights = employeeInsights.filter(insight => insight.risk_level === 'high' || insight.risk_level === 'critical').length;
  const averageUtilization = capacityPlanning.length > 0 
    ? Math.round(capacityPlanning.reduce((sum, cp) => sum + (cp.capacity_utilization || 0), 0) / capacityPlanning.length)
    : 0;
  const analyticsCount = hrAnalytics.length;

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employés Actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Ressources planifiées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisation Capacité</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageUtilization}%</div>
            <p className="text-xs text-muted-foreground">
              Taux d'utilisation moyen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Métriques RH</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsCount}</div>
            <p className="text-xs text-muted-foreground">
              Indicateurs calculés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes IA</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highRiskInsights}</div>
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
              <CardHeader>
                <CardTitle>Vue Capacité vs Charge</CardTitle>
                <CardDescription>
                  Analyse des ressources et planification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Équipe Développement</span>
                      <span>85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Équipe Marketing</span>
                      <span>70%</span>
                    </div>
                    <Progress value={70} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Équipe Finance</span>
                      <span>60%</span>
                    </div>
                    <Progress value={60} className="h-2" />
                  </div>
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
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Surcharge équipe Dev prévue sem. 12</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Profil rare indisponible (React Senior)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Capacité Marketing optimale</span>
                  </div>
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
                      <span className="text-sm">3 employés à risque moyen</span>
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
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Temps moyen recrutement</span>
                    <span className="text-sm font-medium">28 jours</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Taux d'absentéisme</span>
                    <span className="text-sm font-medium">3.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Capacité vs Charge</span>
                    <span className="text-sm font-medium">92%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Performance moyenne</span>
                    <span className="text-sm font-medium">4.2/5</span>
                  </div>
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
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Congés</span>
                    <span className="text-sm font-medium">2.1 jours</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Notes de frais</span>
                    <span className="text-sm font-medium">1.8 jours</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Onboarding</span>
                    <span className="text-sm font-medium">5.2 jours</span>
                  </div>
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
                  <div className="p-3 border rounded-lg">
                    <span className="text-sm font-medium">Performance ↗ Charge optimale</span>
                    <p className="text-xs text-muted-foreground">
                      Corrélation positive détectée
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <span className="text-sm font-medium">Absences ↗ Surcharge</span>
                    <p className="text-xs text-muted-foreground">
                      Alerte préventive activée
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
};