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

  // Calculs pour les KPIs
  const activeJobPosts = jobPosts.filter(job => job.status === 'active').length;
  const totalCandidates = candidates.length;
  const pendingInterviews = interviews.filter(interview => interview.status === 'scheduled').length;
  const highRiskInsights = employeeInsights.filter(insight => insight.risk_level === 'high').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Tableau de Bord RH Avancé</h2>
          <p className="text-muted-foreground">
            Planification capacité, recrutement et intelligence artificielle
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={calculateHRMetrics} variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Calculer Métriques
          </Button>
          <Button onClick={() => generateEmployeeInsights('sample-id')} variant="outline">
            <Brain className="h-4 w-4 mr-2" />
            Générer Insights IA
          </Button>
        </div>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offres Actives</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeJobPosts}</div>
            <p className="text-xs text-muted-foreground">
              +2 depuis le mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candidats</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCandidates}</div>
            <p className="text-xs text-muted-foreground">
              {jobApplications.length} candidatures actives
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entretiens</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInterviews}</div>
            <p className="text-xs text-muted-foreground">
              À venir cette semaine
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="capacity">Capacité</TabsTrigger>
          <TabsTrigger value="recruitment">Recrutement</TabsTrigger>
          <TabsTrigger value="ai-insights">IA Insights</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="policies">Politiques</TabsTrigger>
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

        {/* Onglet Recrutement (Mini-ATS) */}
        <TabsContent value="recruitment" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Pipeline Candidats</CardTitle>
                <CardDescription>
                  Suivi des candidatures par étape
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Candidatures reçues</span>
                    <Badge variant="secondary">{candidates.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">En cours d'évaluation</span>
                    <Badge variant="secondary">
                      {jobApplications.filter(app => app.stage === 'screening').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Entretiens programmés</span>
                    <Badge variant="secondary">{interviews.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Offres en cours</span>
                    <Badge variant="secondary">{jobOffers.length}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Offres d'Emploi</CardTitle>
                <CardDescription>
                  Job board et gestion des postes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {jobPosts.slice(0, 3).map((job) => (
                    <div key={job.id} className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">{job.title}</p>
                        <p className="text-xs text-muted-foreground">{job.location}</p>
                      </div>
                      <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                        {job.status}
                      </Badge>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle Offre
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scorecards Entretiens</CardTitle>
                <CardDescription>
                  Évaluations et recommandations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {interviews.slice(0, 3).map((interview) => (
                    <div key={interview.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">{interview.interviewer_name}</span>
                        <Badge variant="outline">
                          {interview.score ? `${interview.score}/10` : 'Pending'}
                        </Badge>
                      </div>
                      {interview.recommendation && (
                        <p className="text-xs text-muted-foreground">
                          {interview.recommendation}
                        </p>
                      )}
                    </div>
                  ))}
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

        {/* Onglet Politiques Multi-pays */}
        <TabsContent value="policies" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Conformité Multi-pays</CardTitle>
                <CardDescription>
                  Règles par pays et conformité légale
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {countryPolicies.length > 0 ? (
                    countryPolicies.slice(0, 4).map((policy) => (
                      <div key={policy.id} className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4" />
                          <span className="text-sm">{policy.country_name}</span>
                        </div>
                        <div className="flex space-x-2">
                          <Badge variant="outline">{policy.currency}</Badge>
                          <Badge variant="outline">{policy.working_hours_per_week}h/sem</Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Aucune politique configurée
                    </p>
                  )}
                  <Button size="sm" variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter Pays
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Registre Légal</CardTitle>
                <CardDescription>
                  Documents et accusés de lecture
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Règlement Intérieur</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">23/25 accusés</span>
                      <Badge variant="outline">92%</Badge>
                    </div>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Code de Conduite</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">25/25 accusés</span>
                      <Badge variant="default">100%</Badge>
                    </div>
                  </div>
                  
                  <Button size="sm" variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau Document
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};