import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectDashboardEnterprise } from '@/components/projects/ProjectDashboardEnterprise';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const isMobile = useIsMobile();

  return (
    <div className="h-full w-full overflow-auto">
      <div
        className={`h-full w-full ${isMobile ? 'space-y-0 p-0' : 'space-y-4 p-4 md:container md:mx-auto md:px-4'}`}
      >
        {/* Navigation rapide - Visible sur mobile aussi */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
              <span className="inline">Gestion des Tâches</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/hr')}
              className="w-full justify-center sm:w-auto"
              size="sm"
            >
              <Users className="mr-2 h-4 w-4" />
              <span className="inline">Ressources Humaines</span>
            </Button>
          </div>
        </div>

        {/* Raccourcis de navigation - Visible sur mobile aussi */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card
            className="cursor-pointer transition-shadow hover:shadow-lg"
            onClick={() => navigate('/tasks')}
          >
            <CardHeader className="p-3 pb-2 sm:pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <CheckSquare className="text-primary h-4 w-4 sm:h-5 sm:w-5" />
                Gestion des Tâches
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Créer, modifier et assigner des tâches
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs sm:text-sm">
                  Accès complet aux tâches
                </span>
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-shadow hover:shadow-lg">
            <CardHeader className="p-3 pb-2 sm:pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Calendar className="h-4 w-4 text-blue-500 sm:h-5 sm:w-5" />
                Planning Projet
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Vue Gantt et planification
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs sm:text-sm">
                  Calendrier et échéances
                </span>
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-shadow hover:shadow-lg">
            <CardHeader className="p-3 pb-2 sm:pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-4 w-4 text-green-500 sm:h-5 sm:w-5" />
                Rapports Projet
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Analytics et rapports
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs sm:text-sm">
                  Métriques détaillées
                </span>
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Principal */}
        <ProjectDashboardEnterprise showMetrics={true} />
      </div>
    </div>
  );
}
