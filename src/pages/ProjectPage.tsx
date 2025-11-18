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
  FileText,
} from 'lucide-react';

export default function ProjectPage() {
  const navigate = useNavigate();

  return (
    <div className="h-full">
      <div className="container mx-auto space-y-4 px-4 sm:space-y-6">
        {/* Navigation rapide - Responsive */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold sm:text-2xl md:text-3xl">
              Gestion de Projet
            </h1>
            <p className="text-muted-foreground truncate text-xs sm:text-sm md:text-base">
              Dashboard et outils de gestion de projet
            </p>
          </div>
          {/* Boutons stack sur mobile, côte à côte sur desktop */}
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              onClick={() => navigate('/tasks')}
              className="w-full justify-center sm:w-auto"
              size="sm"
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              <span className="hidden md:inline">Gestion des </span>Tâches
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/hr')}
              className="w-full justify-center sm:w-auto"
              size="sm"
            >
              <Users className="mr-2 h-4 w-4" />
              <span className="hidden md:inline">Ressources </span>
              <span className="md:hidden">RH</span>
              <span className="hidden md:inline">Humaines</span>
            </Button>
          </div>
        </div>

        {/* Raccourcis de navigation */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
          <Card
            className="cursor-pointer transition-shadow hover:shadow-lg"
            onClick={() => navigate('/tasks')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckSquare className="text-primary h-5 w-5" />
                Gestion des Tâches
              </CardTitle>
              <CardDescription>Créer, modifier et assigner des tâches</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Accès complet aux tâches</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-shadow hover:shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-blue-500" />
                Planning Projet
              </CardTitle>
              <CardDescription>Vue Gantt et planification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Calendrier et échéances</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-shadow hover:shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-green-500" />
                Rapports Projet
              </CardTitle>
              <CardDescription>Analytics et rapports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Métriques détaillées</span>
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
