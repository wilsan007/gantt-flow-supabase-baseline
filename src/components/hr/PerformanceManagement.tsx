import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, TrendingUp, Users, Star, Calendar, Award, CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Objective {
  id: string;
  title: string;
  description: string;
  employeeName: string;
  department: string;
  type: 'individual' | 'team' | 'okr';
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  progress: number;
  dueDate: string;
  keyResults?: KeyResult[];
}

interface KeyResult {
  id: string;
  title: string;
  progress: number;
  target: string;
  current: string;
}

interface Evaluation {
  id: string;
  employeeName: string;
  evaluatorName: string;
  period: string;
  type: 'annual' | 'quarterly' | '360';
  status: 'scheduled' | 'in-progress' | 'completed';
  overallScore: number;
  categories: EvaluationCategory[];
}

interface EvaluationCategory {
  name: string;
  score: number;
  weight: number;
  feedback?: string;
}

export const PerformanceManagement = () => {
  const [activeView, setActiveView] = useState("objectives");

  const mockObjectives: Objective[] = [
    {
      id: "1",
      title: "Améliorer la satisfaction client",
      description: "Augmenter le NPS de 20 points d'ici la fin du trimestre",
      employeeName: "Sophie Martin",
      department: "Customer Success",
      type: "individual",
      status: "active",
      progress: 75,
      dueDate: "2024-03-31",
      keyResults: [
        { id: "kr1", title: "NPS > 70", progress: 80, target: "70", current: "68" },
        { id: "kr2", title: "Temps de résolution < 24h", progress: 70, target: "24h", current: "28h" }
      ]
    },
    {
      id: "2",
      title: "Développement produit Q1",
      description: "Livrer 3 nouvelles fonctionnalités majeures",
      employeeName: "Équipe Développement",
      department: "IT",
      type: "team",
      status: "active",
      progress: 45,
      dueDate: "2024-03-31"
    }
  ];

  const mockEvaluations: Evaluation[] = [
    {
      id: "1",
      employeeName: "Marie Dubois",
      evaluatorName: "Jean Dupont",
      period: "Q4 2023",
      type: "quarterly",
      status: "completed",
      overallScore: 4.2,
      categories: [
        { name: "Performance technique", score: 4.5, weight: 30 },
        { name: "Collaboration", score: 4.0, weight: 25 },
        { name: "Initiative", score: 4.2, weight: 20 },
        { name: "Communication", score: 4.0, weight: 25 }
      ]
    },
    {
      id: "2",
      employeeName: "Pierre Laurent",
      evaluatorName: "Multiple",
      period: "2023",
      type: "360",
      status: "in-progress",
      overallScore: 0,
      categories: []
    }
  ];

  const getObjectiveStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEvaluationStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 3.5) return 'text-blue-600';
    if (score >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Évaluations & Objectifs</h2>
          <p className="text-muted-foreground">Gestion de la performance et des objectifs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Target className="h-4 w-4 mr-2" />
            Nouvel objectif
          </Button>
          <Button>
            <Star className="h-4 w-4 mr-2" />
            Nouvelle évaluation
          </Button>
        </div>
      </div>

      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="objectives" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Objectifs & OKR
          </TabsTrigger>
          <TabsTrigger value="evaluations" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Évaluations
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="objectives" className="space-y-4">
          <div className="grid gap-4">
            {mockObjectives.map((objective) => (
              <Card key={objective.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {objective.type === 'individual' && <Target className="h-5 w-5" />}
                        {objective.type === 'team' && <Users className="h-5 w-5" />}
                        {objective.type === 'okr' && <Award className="h-5 w-5" />}
                        {objective.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {objective.employeeName} • {objective.department}
                      </p>
                    </div>
                    <Badge className={getObjectiveStatusColor(objective.status)}>
                      {objective.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{objective.description}</p>
                  
                  <div className="flex items-center gap-4">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Échéance: {objective.dueDate}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Progression générale</span>
                      <span className="text-sm text-muted-foreground">{objective.progress}%</span>
                    </div>
                    <Progress value={objective.progress} className="h-2" />
                  </div>

                  {objective.keyResults && objective.keyResults.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Résultats clés</h4>
                      {objective.keyResults.map((kr) => (
                        <div key={kr.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{kr.title}</p>
                            <span className="text-xs text-muted-foreground">
                              {kr.current} / {kr.target}
                            </span>
                          </div>
                          <Progress value={kr.progress} className="h-1" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="evaluations" className="space-y-4">
          <div className="grid gap-4">
            {mockEvaluations.map((evaluation) => (
              <Card key={evaluation.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{evaluation.employeeName}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Évaluateur: {evaluation.evaluatorName} • Période: {evaluation.period}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="uppercase">
                        {evaluation.type}
                      </Badge>
                      <Badge className={getEvaluationStatusColor(evaluation.status)}>
                        {evaluation.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {evaluation.status === 'completed' && (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Star className="h-5 w-5 text-yellow-500" />
                          <span className={`text-2xl font-bold ${getScoreColor(evaluation.overallScore)}`}>
                            {evaluation.overallScore.toFixed(1)}
                          </span>
                          <span className="text-sm text-muted-foreground">/ 5.0</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="font-medium">Détail par catégorie</h4>
                        {evaluation.categories.map((category, index) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div>
                              <p className="font-medium text-sm">{category.name}</p>
                              <p className="text-xs text-muted-foreground">Poids: {category.weight}%</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${getScoreColor(category.score)}`}>
                                {category.score.toFixed(1)}
                              </span>
                              <span className="text-xs text-muted-foreground">/ 5.0</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  
                  {evaluation.status === 'in-progress' && (
                    <div className="flex items-center justify-center p-8 text-muted-foreground">
                      <div className="text-center">
                        <Calendar className="h-8 w-8 mx-auto mb-2" />
                        <p>Évaluation en cours...</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Objectifs Actifs</p>
                    <p className="text-2xl font-bold">24</p>
                  </div>
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Taux de Réalisation</p>
                    <p className="text-2xl font-bold">87%</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Score Moyen</p>
                    <p className="text-2xl font-bold">4.2</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Évaluations Planifiées</p>
                    <p className="text-2xl font-bold">12</p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tendances Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                  <p>Graphiques de performance à venir</p>
                  <p className="text-sm">Évolution des scores et objectifs dans le temps</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};