import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Award, TrendingUp, User, Clock, CheckCircle, Star, Target } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Skill {
  id: string;
  name: string;
  category: string;
  currentLevel: number;
  targetLevel: number;
  lastAssessed: string;
  assessor: string;
}

interface SkillMatrix {
  id: string;
  employeeName: string;
  position: string;
  department: string;
  skills: Skill[];
  overallScore: number;
}

interface Training {
  id: string;
  title: string;
  description: string;
  category: string;
  format: 'online' | 'classroom' | 'workshop' | 'certification';
  duration: string;
  provider: string;
  status: 'available' | 'enrolled' | 'completed' | 'cancelled';
  participants: number;
  maxParticipants: number;
  startDate: string;
  endDate: string;
  rating?: number;
}

interface TrainingRecord {
  id: string;
  employeeName: string;
  trainingTitle: string;
  status: 'enrolled' | 'in-progress' | 'completed' | 'failed';
  enrollmentDate: string;
  completionDate?: string;
  score?: number;
  certificateUrl?: string;
  hoursCompleted: number;
  totalHours: number;
}

export const SkillsTraining = () => {
  const [activeView, setActiveView] = useState("skills");

  const mockSkillsMatrix: SkillMatrix[] = [
    {
      id: "1",
      employeeName: "Marie Dubois",
      position: "Développeuse Senior",
      department: "IT",
      overallScore: 4.2,
      skills: [
        { id: "s1", name: "React", category: "Technique", currentLevel: 4, targetLevel: 5, lastAssessed: "2024-01-15", assessor: "Jean Dupont" },
        { id: "s2", name: "TypeScript", category: "Technique", currentLevel: 3, targetLevel: 4, lastAssessed: "2024-01-15", assessor: "Jean Dupont" },
        { id: "s3", name: "Leadership", category: "Soft Skills", currentLevel: 2, targetLevel: 4, lastAssessed: "2024-01-10", assessor: "Sophie Martin" },
        { id: "s4", name: "Communication", category: "Soft Skills", currentLevel: 4, targetLevel: 4, lastAssessed: "2024-01-10", assessor: "Sophie Martin" }
      ]
    }
  ];

  const mockTrainings: Training[] = [
    {
      id: "1",
      title: "Advanced React Patterns",
      description: "Maîtrisez les patterns avancés de React pour construire des applications robustes",
      category: "Technique",
      format: "online",
      duration: "20h",
      provider: "Tech Academy",
      status: "available",
      participants: 8,
      maxParticipants: 20,
      startDate: "2024-02-15",
      endDate: "2024-03-15",
      rating: 4.8
    },
    {
      id: "2",
      title: "Leadership & Management",
      description: "Développez vos compétences de leadership pour encadrer efficacement une équipe",
      category: "Management",
      format: "classroom",
      duration: "16h",
      provider: "Business School",
      status: "enrolled",
      participants: 12,
      maxParticipants: 15,
      startDate: "2024-02-20",
      endDate: "2024-02-22",
      rating: 4.5
    }
  ];

  const mockTrainingRecords: TrainingRecord[] = [
    {
      id: "1",
      employeeName: "Marie Dubois",
      trainingTitle: "React Fundamentals",
      status: "completed",
      enrollmentDate: "2023-11-01",
      completionDate: "2023-12-15",
      score: 92,
      certificateUrl: "#",
      hoursCompleted: 25,
      totalHours: 25
    },
    {
      id: "2",
      employeeName: "Pierre Laurent",
      trainingTitle: "Project Management Basics",
      status: "in-progress",
      enrollmentDate: "2024-01-10",
      hoursCompleted: 12,
      totalHours: 20
    }
  ];

  const getSkillLevelColor = (level: number) => {
    if (level >= 4) return 'bg-green-100 text-green-800';
    if (level >= 3) return 'bg-blue-100 text-blue-800';
    if (level >= 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getTrainingStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': case 'enrolled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'available': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'failed': case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'online': return <BookOpen className="h-4 w-4" />;
      case 'classroom': return <User className="h-4 w-4" />;
      case 'workshop': return <Target className="h-4 w-4" />;
      case 'certification': return <Award className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
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
            Nouvelle formation
          </Button>
          <Button>
            <TrendingUp className="h-4 w-4 mr-2" />
            Évaluer compétences
          </Button>
        </div>
      </div>

      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="skills" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Matrice Compétences
          </TabsTrigger>
          <TabsTrigger value="catalog" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Catalogue Formation
          </TabsTrigger>
          <TabsTrigger value="records" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Suivi Formation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="skills" className="space-y-4">
          <div className="grid gap-4">
            {mockSkillsMatrix.map((matrix) => (
              <Card key={matrix.id} className="hover:shadow-lg transition-shadow">
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
                    {matrix.skills.map((skill) => (
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
            ))}
          </div>
        </TabsContent>

        <TabsContent value="catalog" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {mockTrainings.map((training) => (
              <Card key={training.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {getFormatIcon(training.format)}
                        {training.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{training.provider}</p>
                    </div>
                    <Badge className={getTrainingStatusColor(training.status)}>
                      {training.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{training.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Catégorie</p>
                      <p className="text-muted-foreground">{training.category}</p>
                    </div>
                    <div>
                      <p className="font-medium">Durée</p>
                      <p className="text-muted-foreground">{training.duration}</p>
                    </div>
                    <div>
                      <p className="font-medium">Format</p>
                      <p className="text-muted-foreground capitalize">{training.format}</p>
                    </div>
                    <div>
                      <p className="font-medium">Participants</p>
                      <p className="text-muted-foreground">
                        {training.participants}/{training.maxParticipants}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <p className="text-muted-foreground">
                        {training.startDate} - {training.endDate}
                      </p>
                    </div>
                    {training.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">{training.rating}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {training.status === 'available' && (
                      <Button size="sm" className="flex-1">S'inscrire</Button>
                    )}
                    {training.status === 'enrolled' && (
                      <Button size="sm" variant="outline" className="flex-1">
                        Voir détails
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <div className="grid gap-4">
            {mockTrainingRecords.map((record) => (
              <Card key={record.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{record.employeeName}</CardTitle>
                      <p className="text-sm text-muted-foreground">{record.trainingTitle}</p>
                    </div>
                    <Badge className={getTrainingStatusColor(record.status)}>
                      {record.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Date d'inscription</p>
                      <p className="text-muted-foreground">{record.enrollmentDate}</p>
                    </div>
                    {record.completionDate && (
                      <div>
                        <p className="font-medium">Date de fin</p>
                        <p className="text-muted-foreground">{record.completionDate}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Progression</span>
                      <span className="text-sm text-muted-foreground">
                        {record.hoursCompleted}h / {record.totalHours}h
                      </span>
                    </div>
                    <Progress 
                      value={(record.hoursCompleted / record.totalHours) * 100} 
                      className="h-2" 
                    />
                  </div>

                  {record.score && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Score final:</span>
                      <Badge className="bg-green-100 text-green-800">
                        {record.score}%
                      </Badge>
                    </div>
                  )}

                  {record.certificateUrl && (
                    <Button variant="outline" size="sm" className="w-full">
                      <Award className="h-4 w-4 mr-2" />
                      Télécharger le certificat
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};