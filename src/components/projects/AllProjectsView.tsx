import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ArrowLeft, BarChart3, Kanban, Table } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useViewMode } from '@/contexts/ViewModeContext';
import GanttChart from '../GanttChart';
import KanbanBoard from '../KanbanBoard';
import DynamicTable from '../DynamicTable';

interface AllProjectsViewProps {
  onBack: () => void;
}

export const AllProjectsView: React.FC<AllProjectsViewProps> = ({ onBack }) => {
  const [currentView, setCurrentView] = useState<'gantt' | 'kanban' | 'table'>('table');
  const { projects, loading: projectsLoading } = useProjects();
  const { tasks, loading: tasksLoading } = useTasks();
  const { setDefaultDisplayMode, resetToDefault } = useViewMode();

  // Définir le mode par défaut sur "projets" quand on entre dans cette vue
  React.useEffect(() => {
    setDefaultDisplayMode('projects');
    
    // Nettoyer quand on quitte la vue
    return () => {
      resetToDefault();
    };
  }, [setDefaultDisplayMode, resetToDefault]);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'gantt':
        return <GanttChart />;
      case 'kanban':
        return <KanbanBoard />;
      case 'table':
      default:
        return <DynamicTable />;
    }
  };

  const getViewDescription = () => {
    switch (currentView) {
      case 'gantt':
        return 'Vue chronologique de tous les projets avec leurs durées d\'exécution';
      case 'kanban':
        return 'Organisation des projets par statut : Planification, En cours, En pause, Terminé';
      case 'table':
        return 'Vue détaillée avec projets et tâches associées dans un tableau dynamique';
      default:
        return '';
    }
  };

  if (projectsLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3">Chargement des projets...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              <div>
                <CardTitle className="text-2xl">Tous les Projets</CardTitle>
                <p className="text-muted-foreground mt-1">
                  {projects.length} projet{projects.length > 1 ? 's' : ''} • {getViewDescription()}
                </p>
              </div>
            </div>

            {/* Sélecteur de vue */}
            <ToggleGroup 
              type="single" 
              value={currentView} 
              onValueChange={(value) => value && setCurrentView(value as 'gantt' | 'kanban' | 'table')}
              className="bg-muted/50 p-1 rounded-lg"
            >
              <ToggleGroupItem 
                value="table" 
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground flex items-center gap-2"
              >
                <Table className="h-4 w-4" />
                Tableau
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="gantt" 
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Gantt
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="kanban" 
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground flex items-center gap-2"
              >
                <Kanban className="h-4 w-4" />
                Kanban
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardHeader>
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Projets</p>
                <p className="text-2xl font-bold">{projects.length}</p>
              </div>
              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                📁
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En Cours</p>
                <p className="text-2xl font-bold text-blue-600">
                  {projects.filter(p => p.status === 'active').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                ⚡
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Terminés</p>
                <p className="text-2xl font-bold text-green-600">
                  {projects.filter(p => p.status === 'completed').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                ✅
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Progression Moyenne</p>
                <p className="text-2xl font-bold text-orange-600">
                  {projects.length > 0 
                    ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
                    : 0
                  }%
                </p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                📊
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vue sélectionnée */}
      <div className="min-h-[600px]">
        {renderCurrentView()}
      </div>
    </div>
  );
};
