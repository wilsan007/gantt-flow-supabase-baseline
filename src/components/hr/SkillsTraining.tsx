import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Award, TrendingUp, User, Clock, CheckCircle, Star, Target } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSkillsTraining } from '@/hooks/useSkillsTraining';

export const SkillsTraining = () => {
  const [activeView, setActiveView] = useState("skills");
  
  const {
    skills,
    skillAssessments,
    loading,
    error,
    createSkill,
    createSkillAssessment,
    getSkillsMatrix,
    getSkillsStats
  } = useSkillsTraining();

  if (loading) return <div className="p-6 text-center">Chargement des données de formation...</div>;
  if (error) return <div className="p-6 text-center text-destructive">Erreur: {error}</div>;

  const skillsMatrix = getSkillsMatrix();
  const skillsStats = getSkillsStats();

  const getSkillLevelColor = (level: number) => {
    if (level >= 4) return 'bg-green-100 text-green-800';
    if (level >= 3) return 'bg-blue-100 text-blue-800';
    if (level >= 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Compétences & Formations</h2>
          <p className="text-muted-foreground">Développement des compétences et gestion de la formation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <BookOpen className="h-4 w-4 mr-2" />
            Nouvelle compétence
          </Button>
          <Button>
            <TrendingUp className="h-4 w-4 mr-2" />
            Évaluer compétences
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compétences</p>
                <p className="text-2xl font-bold">{skillsStats.totalSkills}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Évaluations</p>
                <p className="text-2xl font-bold">{skillsStats.totalAssessments}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Niveau moyen</p>
                <p className="text-2xl font-bold">{skillsStats.averageLevel.toFixed(1)}/5</p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="skills" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Matrice Compétences
          </TabsTrigger>
          <TabsTrigger value="catalog" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Catalogue Compétences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="skills" className="space-y-4">
          <div className="grid gap-4">
            {skillsMatrix.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune évaluation de compétence disponible</p>
                  <Button className="mt-4" onClick={() => {/* TODO: Open create dialog */}}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Créer une évaluation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              skillsMatrix.map((matrix: any) => (
                <Card key={matrix.employeeName} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{matrix.employeeName}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {matrix.position} • {matrix.department}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        <span className="text-xl font-bold text-primary">
                          {matrix.overallScore.toFixed(1)}
                        </span>
                        <span className="text-sm text-muted-foreground">/ 5.0</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4">
                      {matrix.skills.map((skill: any) => (
                        <div key={skill.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-medium text-sm">{skill.name}</p>
                                <p className="text-xs text-muted-foreground">{skill.category}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getSkillLevelColor(skill.currentLevel)}>
                                  {skill.currentLevel}/5
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  → Cible: {skill.targetLevel}/5
                                </span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Progress 
                                value={(skill.currentLevel / 5) * 100} 
                                className="h-2" 
                              />
                              <p className="text-xs text-muted-foreground">
                                Évalué le {skill.lastAssessed} par {skill.assessor}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="catalog" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {skills.length === 0 ? (
              <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="p-8 text-center">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune compétence définie</p>
                  <Button className="mt-4" onClick={() => {/* TODO: Open create dialog */}}>
                    <Target className="h-4 w-4 mr-2" />
                    Ajouter une compétence
                  </Button>
                </CardContent>
              </Card>
            ) : (
              skills.map((skill) => (
                <Card key={skill.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-2xl">🎯</div>
                      <div>
                        <h3 className="font-medium">{skill.name}</h3>
                        <Badge variant="outline">
                          {skill.category}
                        </Badge>
                      </div>
                    </div>
                    
                    {skill.description && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {skill.description}
                      </p>
                    )}
                    
                    <div className="text-sm">
                      <p className="text-muted-foreground">Évaluations:</p>
                      <p className="font-bold text-lg">
                        {skillAssessments.filter(a => a.skill_id === skill.id).length}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};