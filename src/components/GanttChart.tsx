import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useTasks, Task } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useIsMobile } from '@/hooks/use-mobile';
import { GanttHeader } from './gantt/GanttHeader';
import { GanttTaskList } from './gantt/GanttTaskList';
import { GanttTimeline } from './gantt/GanttTimeline';
import { GanttLoadingState, GanttErrorState } from './gantt/GanttStates';
import { MobileGanttChart } from './responsive/MobileGanttChart';
import { useGanttDrag } from '@/hooks/useGanttDrag';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { 
  ViewMode, 
  GanttTask, 
  getViewConfig, 
  statusColors 
} from '@/lib/ganttHelpers';

// Palette de couleurs pour les projets
const PROJECT_COLORS = [
  '#3b82f6', // Bleu
  '#10b981', // Vert
  '#f59e0b', // Orange
  '#ef4444', // Rouge
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#f97316', // Orange foncé
  '#84cc16', // Lime
  '#ec4899', // Rose
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#f43f5e', // Rose rouge
];

const GanttChart = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [displayMode, setDisplayMode] = useState<'tasks' | 'projects'>('tasks');
  const { tasks, loading, error, updateTaskDates } = useTasks();
  const { projects, loading: projectsLoading, error: projectsError } = useProjects();
  const isMobile = useIsMobile();
  
  const config = getViewConfig(viewMode);
  const rowHeight = 60;
  const startDate = new Date(2024, 0, 1);
  const endDate = new Date(2024, 11, 31);

  // Fonction pour assigner une couleur à un projet basée sur son ID
  const getProjectColor = (projectId: string | undefined, projectName: string | undefined): string => {
    if (!projectId && !projectName) return '#6b7280'; // Gris par défaut
    
    const identifier = projectId || projectName || '';
    // Utiliser un hash simple pour assigner une couleur de manière déterministe
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % PROJECT_COLORS.length;
    return PROJECT_COLORS[colorIndex];
  };

  const getGanttTask = (task: Task): GanttTask => ({
    id: task.id,
    name: task.title,
    startDate: new Date(task.start_date),
    endDate: new Date(task.due_date),
    progress: task.progress,
    // Utiliser la couleur du projet si disponible, sinon couleur par statut
    color: displayMode === 'tasks' ? getProjectColor(task.project_id, task.project_name) : statusColors[task.status],
    assignee: task.assignee,
    priority: task.priority,
    status: task.status,
    projectName: task.project_name // Ajouter le nom du projet pour le regroupement
  });

  const getGanttProject = (project: any): GanttTask => ({
    id: project.id,
    name: project.name,
    startDate: project.start_date ? new Date(project.start_date) : new Date(),
    endDate: project.end_date ? new Date(project.end_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    progress: project.progress || 0,
    // Utiliser la couleur déterministe du projet
    color: getProjectColor(project.id, project.name),
    assignee: project.manager_name || 'Non assigné',
    priority: project.priority || 'medium',
    status: project.status || 'planning',
    projectName: project.name // Pour les projets, le nom du projet est le nom lui-même
  });

  const ganttTasks = displayMode === 'tasks' ? tasks.map(getGanttTask) : projects.map(getGanttProject);

  const {
    draggedTask,
    resizeTask,
    chartRef,
    taskMouseDownHandler,
    handleMouseMove,
    handleMouseUp
  } = useGanttDrag(config, startDate, updateTaskDates);

  const onTaskMouseDown = (
    e: React.MouseEvent, 
    taskId: string, 
    action: 'drag' | 'resize-left' | 'resize-right'
  ) => {
    taskMouseDownHandler(e, taskId, action, ganttTasks);
  };

  useEffect(() => {
    if (draggedTask || resizeTask) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedTask, resizeTask, handleMouseMove, handleMouseUp]);

  if (loading || (displayMode === 'projects' && projectsLoading)) {
    return <GanttLoadingState />;
  }

  if (error || (displayMode === 'projects' && projectsError)) {
    return <GanttErrorState error={error || projectsError} />;
  }

  // Use mobile version on small screens
  if (isMobile) {
    return (
      <MobileGanttChart 
        tasks={tasks}
        loading={loading}
        error={error}
        updateTaskDates={updateTaskDates}
      />
    );
  }

  return (
    <Card className="w-full modern-card glow-primary transition-smooth">
      <GanttHeader 
        viewMode={viewMode} 
        onViewModeChange={setViewMode} 
      />
      
      {/* Boutons de basculement Projet/Tâches */}
      <div className="px-6 pb-4 bg-gantt-header/20">
        <ToggleGroup 
          type="single" 
          value={displayMode} 
          onValueChange={(value) => value && setDisplayMode(value as 'tasks' | 'projects')}
          className="justify-start"
        >
          <ToggleGroupItem value="tasks" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
            📝 Tâches
          </ToggleGroupItem>
          <ToggleGroupItem value="projects" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
            📁 Projets
          </ToggleGroupItem>
        </ToggleGroup>
        {displayMode === 'projects' && (
          <p className="text-sm text-muted-foreground mt-2">
            Vue Gantt des projets - Chaque barre représente la durée complète d'un projet
          </p>
        )}
      </div>
      
      <CardContent className="p-0 bg-gantt-header/50 backdrop-blur-sm">
        <div className="flex h-[600px] lg:h-[700px] overflow-hidden rounded-b-xl">
          <GanttTaskList 
            tasks={ganttTasks} 
            rowHeight={rowHeight}
            displayMode={displayMode}
          />
          <div ref={chartRef} className="flex-1 min-w-0 bg-gantt-task-bg/30">
            <GanttTimeline
              tasks={ganttTasks}
              config={config}
              startDate={startDate}
              endDate={endDate}
              rowHeight={rowHeight}
              draggedTask={draggedTask}
              resizeTask={resizeTask}
              onTaskMouseDown={onTaskMouseDown}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GanttChart;