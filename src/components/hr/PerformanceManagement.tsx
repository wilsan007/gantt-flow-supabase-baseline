import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, TrendingUp, Users, Star, Calendar, Award, CheckCircle2, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePerformance } from "@/hooks/usePerformance";
import { CreateObjectiveDialog } from "./CreateObjectiveDialog";
import { CreateEvaluationDialog } from "./CreateEvaluationDialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Interfaces moved to usePerformance hook

export const PerformanceManagement = () => {
  const [activeView, setActiveView] = useState("objectives");
  const {
    objectives,
    evaluations,
    keyResults,
    evaluationCategories,
    loading,
    error,
    createObjective,
    createEvaluation,
    getKeyResultsByObjective,
    getCategoriesByEvaluation,
    getPerformanceStats
  } = usePerformance();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des données de performance...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-500 mb-2">Erreur lors du chargement des données</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const stats = getPerformanceStats();

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
          <CreateObjectiveDialog onCreateObjective={createObjective} />
          <CreateEvaluationDialog onCreateEvaluation={createEvaluation} />
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
          {objectives.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center p-8">
                <div className="text-center">
                  <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Aucun objectif trouvé</h3>
                  <p className="text-muted-foreground mb-4">Commencez par créer votre premier objectif</p>
                  <CreateObjectiveDialog onCreateObjective={createObjective} />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {objectives.map((objective) => {
                const objectiveKeyResults = getKeyResultsByObjective(objective.id);
                return (
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
                            {objective.employee_name} • {objective.department}
                          </p>
                        </div>
                        <Badge className={getObjectiveStatusColor(objective.status)}>
                          {objective.status === 'active' ? 'Actif' : 
                           objective.status === 'completed' ? 'Terminé' :
                           objective.status === 'draft' ? 'Brouillon' : 'Annulé'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {objective.description && (
                        <p className="text-sm text-muted-foreground">{objective.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Échéance: {format(new Date(objective.due_date), 'dd MMMM yyyy', { locale: fr })}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Progression générale</span>
                          <span className="text-sm text-muted-foreground">{objective.progress}%</span>
                        </div>
                        <Progress value={objective.progress} className="h-2" />
                      </div>

                      {objectiveKeyResults.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium">Résultats clés</h4>
                          {objectiveKeyResults.map((kr) => (
                            <div key={kr.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-sm">{kr.title}</p>
                                <span className="text-xs text-muted-foreground">
                                  {kr.current_value || '0'} / {kr.target}
                                </span>
                              </div>
                              <Progress value={kr.progress} className="h-1" />
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="evaluations" className="space-y-4">
          {evaluations.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center p-8">
                <div className="text-center">
                  <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Aucune évaluation trouvée</h3>
                  <p className="text-muted-foreground mb-4">Commencez par créer votre première évaluation</p>
                  <CreateEvaluationDialog onCreateEvaluation={createEvaluation} />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {evaluations.map((evaluation) => {
                const evaluationCategories = getCategoriesByEvaluation(evaluation.id);
                return (
                  <Card key={evaluation.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{evaluation.employee_name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Évaluateur: {evaluation.evaluator_name} • Période: {evaluation.period}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="uppercase">
                            {evaluation.type === 'annual' ? 'Annuelle' :
                             evaluation.type === 'quarterly' ? 'Trimestrielle' : '360°'}
                          </Badge>
                          <Badge className={getEvaluationStatusColor(evaluation.status)}>
                            {evaluation.status === 'completed' ? 'Terminée' :
                             evaluation.status === 'in_progress' ? 'En cours' : 'Planifiée'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {evaluation.status === 'completed' && evaluation.overall_score > 0 && (
                        <>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Star className="h-5 w-5 text-yellow-500" />
                              <span className={`text-2xl font-bold ${getScoreColor(evaluation.overall_score)}`}>
                                {evaluation.overall_score.toFixed(1)}
                              </span>
                              <span className="text-sm text-muted-foreground">/ 5.0</span>
                            </div>
                          </div>
                          
                          {evaluationCategories.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="font-medium">Détail par catégorie</h4>
                              {evaluationCategories.map((category) => (
                                <div key={category.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
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
                          )}
                        </>
                      )}
                      
                      {evaluation.status === 'scheduled' && (
                        <div className="flex items-center justify-center p-8 text-muted-foreground">
                          <div className="text-center">
                            <Calendar className="h-8 w-8 mx-auto mb-2" />
                            <p>Évaluation planifiée</p>
                          </div>
                        </div>
                      )}
                      
                      {evaluation.status === 'in_progress' && (
                        <div className="flex items-center justify-center p-8 text-muted-foreground">
                          <div className="text-center">
                            <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                            <p>Évaluation en cours...</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Objectifs Actifs</p>
                    <p className="text-2xl font-bold">{stats.activeObjectives}</p>
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
                    <p className="text-2xl font-bold">{stats.completionRate}%</p>
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
                    <p className="text-2xl font-bold">{stats.averageScore > 0 ? stats.averageScore : '--'}</p>
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
                    <p className="text-2xl font-bold">{stats.scheduledEvaluations}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Répartition des objectifs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['draft', 'active', 'completed', 'cancelled'].map(status => {
                    const count = objectives.filter(obj => obj.status === status).length;
                    const percentage = objectives.length > 0 ? Math.round((count / objectives.length) * 100) : 0;
                    const colorClass = status === 'completed' ? 'text-green-600' : 
                                      status === 'active' ? 'text-blue-600' : 
                                      status === 'cancelled' ? 'text-red-600' : 'text-yellow-600';
                    return (
                      <div key={status} className="flex justify-between items-center">
                        <span className="capitalize">{status === 'draft' ? 'Brouillon' : 
                                                       status === 'active' ? 'Actif' : 
                                                       status === 'completed' ? 'Terminé' : 'Annulé'}</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${colorClass}`}>{count}</span>
                          <span className="text-sm text-muted-foreground">({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Évaluations par type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['annual', 'quarterly', '360'].map(type => {
                    const count = evaluations.filter(evaluation => evaluation.type === type).length;
                    const percentage = evaluations.length > 0 ? Math.round((count / evaluations.length) * 100) : 0;
                    return (
                      <div key={type} className="flex justify-between items-center">
                        <span>{type === 'annual' ? 'Annuelle' : type === 'quarterly' ? 'Trimestrielle' : '360°'}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{count}</span>
                          <span className="text-sm text-muted-foreground">({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Distribution des scores d'évaluation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {evaluations.length > 0 ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span>Score moyen</span>
                      <span className="font-bold text-2xl">{getPerformanceStats().averageScore}/5</span>
                    </div>
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map(score => {
                        const count = evaluations.filter(evaluation => Math.round(evaluation.overall_score) === score).length;
                        const percentage = evaluations.length > 0 ? Math.round((count / evaluations.length) * 100) : 0;
                        return (
                          <div key={score} className="flex items-center gap-4">
                            <span className="w-12">{score} ⭐</span>
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-12">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                    <p>Aucune évaluation disponible</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};