import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
// Hooks optimisés avec cache intelligent et métriques
import { useTasks, type Task } from '@/hooks/optimized';
import { useProjects } from '@/hooks/optimized';
import { useIsMobile } from '@/hooks/use-mobile';
import { GanttHeader } from '../gantt/GanttHeader';
import { GanttTimeline } from '../gantt/GanttTimeline';
import { GanttLoadingState, GanttErrorState } from '../gantt/GanttStates';
import { MobileGanttChart } from '../responsive/MobileGanttChart';
import { useGanttDrag } from '@/hooks/useGanttDrag';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
// ✅ NOUVEAUX IMPORTS POUR GESTION D'ERREUR
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  ViewMode,
  GanttTask,
  getViewConfig,
  statusColors,
  getTotalUnits,
  ViewConfig
} from '@/lib/ganttHelpers';
import {
  assignProjectColors,
  getTaskColor,
  ProjectColorMap
} from '@/lib/ganttColors';

const GanttChart = () => {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [displayMode, setDisplayMode] = useState<'tasks' | 'projects'>('tasks');
  // ✅ État pour gérer les erreurs de mise à jour de dates
  const [dateUpdateError, setDateUpdateError] = useState<{
    message: string;
    details?: string;
    suggestion?: string;
  } | null>(null);

  // ✅ État pour suivre la tâche qui a causé l'erreur et ses dates originales
  const [errorTaskInfo, setErrorTaskInfo] = useState<{
    taskId: string;
    originalStartDate: Date;
    originalEndDate: Date;
  } | null>(null);

  const { tasks, loading, error, updateTaskDates, refresh } = useTasks();
  const { projects, loading: projectsLoading, error: projectsError } = useProjects();
  const isMobile = useIsMobile();
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const taskListScrollRef = React.useRef<HTMLDivElement>(null);
  const timelineScrollRef = React.useRef<HTMLDivElement>(null);
  
  const config = getViewConfig(viewMode);
  const rowHeight = 60;

  // Créer le map de couleurs pour les projets
  const projectColorMap: ProjectColorMap = React.useMemo(() => {
    return assignProjectColors(projects);
  }, [projects]);

  // ⚡ Calculer la plage de dates AVANT de l'utiliser
  const calculateDateRange = () => {
    const items = displayMode === 'tasks' ? tasks : projects;
    if (items.length === 0) {
      return {
        start: new Date(new Date().getFullYear(), 0, 1),
        end: new Date(new Date().getFullYear(), 11, 31)
      };
    }

    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    items.forEach((item: any) => {
      const startDateStr = item.start_date;
      const endDateStr = item.due_date || item.end_date;
      
      if (!startDateStr || !endDateStr) return;
      
      const start = new Date(startDateStr);
      const end = new Date(endDateStr);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
      
      if (minDate === null || start < minDate) minDate = start;
      if (maxDate === null || end > maxDate) maxDate = end;
    });

    if (!minDate || !maxDate) {
      return {
        start: new Date(new Date().getFullYear(), 0, 1),
        end: new Date(new Date().getFullYear(), 11, 31)
      };
    }

    const startWithMargin = new Date(minDate);
    startWithMargin.setMonth(startWithMargin.getMonth() - 1);
    
    const endWithMargin = new Date(maxDate);
    endWithMargin.setMonth(endWithMargin.getMonth() + 1);

    return { start: startWithMargin, end: endWithMargin };
  };

  const { start: startDate, end: endDate } = calculateDateRange();

  // ✅ Fonction pour remettre les barres à leur position originale (appelée par le hook)
  const resetTaskPositions = React.useCallback(async () => {
    // Forcer le rafraîchissement des données depuis Supabase
    await refresh();
    
    // Animation visuelle après le refresh
    if (errorTaskInfo) {
      const { taskId } = errorTaskInfo;
      
      // Attendre que le DOM soit mis à jour après le refresh
      setTimeout(() => {
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`) as HTMLElement;
        if (taskElement) {
          // Flash visuel pour indiquer le reset
          taskElement.style.outline = '3px solid #ef4444';
          taskElement.style.transition = 'outline 0.3s ease-out';
          
          setTimeout(() => {
            taskElement.style.outline = '';
            setTimeout(() => {
              taskElement.style.transition = '';
            }, 300);
          }, 500);
        }
      }, 100);
    }
  }, [errorTaskInfo, refresh]);

  // ✅ Fonction wrapper pour gérer les erreurs de mise à jour de dates
  const handleUpdateTaskDates = async (taskId: string, startDate: string, endDate: string) => {
    try {
      setDateUpdateError(null); // Effacer les erreurs précédentes
      setErrorTaskInfo(null); // Effacer les infos de tâche en erreur
      await updateTaskDates(taskId, startDate, endDate);
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour des dates:', error);

      // ✅ Sauvegarder les dates originales de la tâche avant modification
      const originalTask = tasks.find(t => t.id === taskId);
      if (originalTask) {
        setErrorTaskInfo({
          taskId,
          originalStartDate: new Date(originalTask.start_date),
          originalEndDate: new Date(originalTask.due_date)
        });

        // ✅ Remettre immédiatement la barre à sa position originale
        setTimeout(() => {
          resetTaskPositions();
        }, 100); // Petit délai pour laisser le DOM se mettre à jour
      }

      // ✅ Parser l'erreur pour afficher un message utilisateur-friendly
      let errorMessage = 'Erreur lors de la mise à jour des dates';
      let errorDetails = '';
      let errorSuggestion = '';

      if (error?.message) {
        // Extraire les informations de l'erreur formatée
        const messageMatch = error.message.match(/❌ (.+?)\n\n/);
        if (messageMatch) {
          errorMessage = messageMatch[1];
        }

        const detailsMatch = error.message.match(/📅 (.+?)\n/);
        if (detailsMatch) {
          errorDetails = detailsMatch[1];
        }

        const suggestionMatch = error.message.match(/💡 (.+)/);
        if (suggestionMatch) {
          errorSuggestion = suggestionMatch[1];
        }
      }

      // ✅ Afficher l'erreur à l'utilisateur avec un toast
      toast({
        variant: 'destructive',
        title: '❌ ' + errorMessage,
        description: (
          <div className="mt-2 space-y-2">
            {errorDetails && <p className="text-sm">📅 {errorDetails}</p>}
            {errorSuggestion && <p className="text-sm font-medium">💡 {errorSuggestion}</p>}
            <p className="text-xs text-muted-foreground mt-2">La barre a été replacée à sa position valide.</p>
          </div>
        ),
        duration: 7000, // 7 secondes
      });
      
      // Garder aussi la modal pour les cas où le toast n'est pas visible
      setDateUpdateError({
        message: errorMessage,
        details: errorDetails,
        suggestion: errorSuggestion
      });
      
      // Fermeture automatique de la modal après 6 secondes
      setTimeout(() => {
        setDateUpdateError(null);
      }, 6000);
    }
  };

  // Synchroniser le scroll vertical entre la liste et la timeline
  const handleScroll = (source: 'list' | 'timeline') => (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    
    if (source === 'list' && timelineScrollRef.current) {
      timelineScrollRef.current.scrollTop = scrollTop;
    } else if (source === 'timeline' && taskListScrollRef.current) {
      taskListScrollRef.current.scrollTop = scrollTop;
    }
  };

  // Fonction helper pour rendre le header de la timeline
  const renderTimelineHeader = (start: Date, end: Date, viewConfig: ViewConfig) => {
    const totalUnits = getTotalUnits(start, end, viewConfig);
    const units = [];
    let currentDate = new Date(start);
    
    for (let i = 0; i < totalUnits; i++) {
      if (viewConfig.unitDuration === 30) {
        currentDate = new Date(start.getFullYear(), start.getMonth() + i, 1);
      } else {
        currentDate = new Date(start.getTime() + i * viewConfig.unitDuration * 24 * 60 * 60 * 1000);
      }
      
      units.push(
        <div
          key={i}
          className="flex h-full items-center justify-center border-r border-gantt-grid text-xs text-foreground/70"
          style={{ minWidth: viewConfig.unitWidth }}
        >
          <div className="text-center">
            <div className="font-medium text-foreground">{viewConfig.getUnit(currentDate)}</div>
            <div className="text-xs opacity-60 text-foreground/60">
              {viewConfig.getSubUnit(currentDate)}
            </div>
          </div>
        </div>
      );
    }
    return units;
  };

  // Compter les tâches sans projet pour l'attribution des couleurs
  const tasksWithoutProject = React.useMemo(() => {
    return tasks.filter(t => !t.project_id);
  }, [tasks]);

  const getGanttTask = (task: Task, index: number): GanttTask => {
    // Obtenir la couleur selon le projet_id UNIQUEMENT
    const taskColor = getTaskColor(
      { project_id: task.project_id },
      projectColorMap,
      index,
      projects.length
    );

    return {
      id: task.id,
      name: task.title,
      startDate: new Date(task.start_date),
      endDate: new Date(task.due_date),
      progress: task.progress || 0,
      color: taskColor,
      assignee: task.assigned_name || 'Non assigné',
      priority: task.priority,
      status: task.status,
      project_id: task.project_id // ✅ Uniquement project_id, pas project_name
    };
  };

  const getGanttProject = (project: any, index: number): GanttTask => {
    const projectColor = projectColorMap[project.id] || '#6b7280';

    return {
      id: project.id,
      name: project.name,
      startDate: project.start_date ? new Date(project.start_date) : new Date(),
      endDate: project.end_date ? new Date(project.end_date) : new Date(),
      progress: project.progress || 0,
      color: projectColor,
      assignee: project.manager_name || 'Non assigné',
      priority: project.priority || 'medium',
      status: project.status || 'planning',
      project_id: project.id
    };
  };

  const ganttTasks = displayMode === 'tasks' ? tasks.map(getGanttTask) : projects.map(getGanttProject);

  const {
    draggedTask,
    resizeTask,
    chartRef,
    taskMouseDownHandler,
    handleMouseMove,
    handleMouseUp
  } = useGanttDrag(config, startDate, handleUpdateTaskDates, resetTaskPositions);

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
        tasks={ganttTasks}
        loading={loading}
        error={error}
        updateTaskDates={handleUpdateTaskDates}
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
        <div className="h-[600px] lg:h-[700px] rounded-b-xl flex flex-col overflow-hidden">
          {/* Headers fixes (ne scrollent pas) */}
          <div className="flex border-b border-gantt-grid/50 flex-shrink-0 z-20">
            {/* Header liste tâches */}
            <div className="w-64 h-20 flex items-center px-4 bg-gantt-header border-r border-gantt-grid/50">
              <span className="font-medium text-foreground">
                {displayMode === 'projects' ? 'Projets' : 'Tâches'}
              </span>
            </div>
            
            {/* Header timeline - scroll horizontal uniquement */}
            <div 
              ref={chartRef}
              className="flex-1 bg-gantt-header overflow-x-auto overflow-y-hidden scrollbar-thin"
              onScroll={(e) => {
                // Synchroniser le scroll horizontal avec le contenu
                if (timelineScrollRef.current) {
                  timelineScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
                }
              }}
            >
              <div 
                className="flex border-b border-gantt-grid h-20"
                style={{ minWidth: getTotalUnits(startDate, endDate, config) * config.unitWidth }}
              >
                {renderTimelineHeader(startDate, endDate, config)}
              </div>
            </div>
          </div>
          
          {/* Contenu scrollable verticalement */}
          <div className="flex flex-1 overflow-hidden">
            {/* Liste des tâches - scroll vertical */}
            <div 
              ref={taskListScrollRef}
              className="w-64 overflow-y-auto overflow-x-hidden scrollbar-thin border-r border-gantt-grid/50 bg-gantt-task-bg/30"
              onScroll={handleScroll('list')}
            >
              {displayMode === 'projects' ? (
                ganttTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center px-4 border-b border-gantt-grid/30 hover:bg-gantt-hover/20 transition-smooth cursor-pointer"
                    style={{ height: rowHeight }}
                  >
                    <div>
                      <div className="font-bold text-lg text-foreground">
                        📁 {task.name}
                      </div>
                      <div className="text-sm text-foreground/70">
                        {task.assignee}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                // Mode tâches : regroupement par project_id UNIQUEMENT
                (() => {
                  // Étape 1: Regrouper les tâches par project_id (pas par nom !)
                  const groupedTasks = ganttTasks.reduce((groups: { [key: string]: typeof ganttTasks }, task) => {
                    const projectKey = task.project_id || 'no-project';
                    
                    if (!groups[projectKey]) {
                      groups[projectKey] = [];
                    }
                    groups[projectKey].push(task);
                    return groups;
                  }, {});
                  
                  // Étape 2: Utiliser l'ordre original des projets pour garantir la cohérence numéros/couleurs
                  // Le nom et la couleur viennent UNIQUEMENT du tableau projects[] via project_id
                  const orderedProjectGroups = projects
                    .filter(project => groupedTasks[project.id]) // Garder seulement les projets avec tâches
                    .map((project, index) => ({
                      projectId: project.id,
                      projectName: project.name, // ✅ Nom du projet depuis projects[] via project_id
                      projectNumber: index + 1,
                      projectColor: projectColorMap[project.id], // ✅ Couleur du projet via project_id
                      tasks: groupedTasks[project.id]
                    }));
                  
                  // Ajouter les tâches sans projet à la fin
                  if (groupedTasks['no-project']) {
                    orderedProjectGroups.push({
                      projectId: 'no-project',
                      projectName: 'Sans projet',
                      projectNumber: null,
                      projectColor: '#6b7280',
                      tasks: groupedTasks['no-project']
                    });
                  }
                  
                  // Étape 3: Afficher dans l'ordre correct
                  return orderedProjectGroups.map(({ projectId, projectName, projectNumber, projectColor, tasks }) => (
                    <div key={projectId}>
                      <div 
                        className="flex items-center px-4 border-b-2 border-gantt-grid/50"
                        style={{ 
                          height: rowHeight,
                          backgroundColor: projectColor,
                          opacity: 0.9
                        }}
                      >
                        <div className="font-bold text-white flex items-center gap-2">
                          {projectNumber && (
                            <span className="bg-white/20 px-2 py-0.5 rounded text-sm">
                              #{projectNumber}
                            </span>
                          )}
                          📁 {projectName}
                        </div>
                      </div>
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center px-6 border-b border-gantt-grid/30 hover:bg-gantt-hover/20 transition-smooth cursor-pointer"
                          style={{ height: rowHeight }}
                        >
                          <div>
                            <div className="font-medium text-foreground">{task.name}</div>
                            <div className="text-sm text-foreground/70">
                              {task.assignee}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ));
                })()
              )}
            </div>
            
            {/* Timeline - scroll vertical + horizontal synchronisé */}
            <div 
              ref={timelineScrollRef}
              className="flex-1 min-w-0 bg-gantt-task-bg/30 overflow-auto scrollbar-thin"
              onScroll={(e) => {
                // Synchroniser scroll vertical avec la liste
                if (taskListScrollRef.current) {
                  taskListScrollRef.current.scrollTop = e.currentTarget.scrollTop;
                }
                // Synchroniser scroll horizontal avec le header
                if (chartRef.current) {
                  chartRef.current.scrollLeft = e.currentTarget.scrollLeft;
                }
              }}
            >
              <GanttTimeline
                tasks={ganttTasks}
                config={config}
                startDate={startDate}
                endDate={endDate}
                rowHeight={rowHeight}
                draggedTask={draggedTask}
                resizeTask={resizeTask}
                onTaskMouseDown={onTaskMouseDown}
                displayMode={displayMode}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      {ganttContent}

      {/* ✅ Modal d'erreur centré pour les problèmes de mise à jour de dates */}
      {dateUpdateError && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-destructive mb-2">
                  {dateUpdateError.message}
                </h3>
                {dateUpdateError.details && (
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Détails :</strong> {dateUpdateError.details}
                  </p>
                )}
                {dateUpdateError.suggestion && (
                  <p className="text-sm text-muted-foreground mb-4">
                    <strong>Solution :</strong> {dateUpdateError.suggestion}
                  </p>
                )}
                <Button
                  onClick={() => setDateUpdateError(null)}
                  className="w-full"
                >
                  Compris
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GanttChart;