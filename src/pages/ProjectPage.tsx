import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectDashboardEnterprise } from '@/components/projects/ProjectDashboardEnterprise';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  CheckSquare, 
  Users, 
  Calendar,
  ArrowRight,
  Settings,
  FileText
} from 'lucide-react';

export default function ProjectPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Navigation rapide */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gestion de Projet</h1>
            <p className="text-muted-foreground">
              Dashboard et outils de gestion de projet
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/tasks')}>
              <CheckSquare className="h-4 w-4 mr-2" />
              Gestion des Tâches
            </Button>
            <Button variant="outline" onClick={() => navigate('/hr')}>
              <Users className="h-4 w-4 mr-2" />
              Ressources Humaines
            </Button>
          </div>
        </div>

        {/* Raccourcis de navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/tasks')}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckSquare className="h-5 w-5 text-primary" />
                Gestion des Tâches
              </CardTitle>
              <CardDescription>
                Créer, modifier et assigner des tâches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Accès complet aux tâches</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-blue-500" />
                Planning Projet
              </CardTitle>
              <CardDescription>
                Vue Gantt et planification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Calendrier et échéances</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-green-500" />
                Rapports Projet
              </CardTitle>
              <CardDescription>
                Analytics et rapports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Métriques détaillées</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Principal */}
        <ProjectDashboardEnterprise />
      </div>
    </div>
  );
}