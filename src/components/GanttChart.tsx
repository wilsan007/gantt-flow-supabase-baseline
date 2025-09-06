import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarDays, Clock, Loader2 } from 'lucide-react';
import { useTasks, Task } from '@/hooks/useTasks';

type ViewMode = 'day' | 'week' | 'month';

// Couleurs par priorité pour le Gantt
const priorityColors = {
  low: 'success',
  medium: 'warning', 
  high: 'destructive',
  urgent: 'tech-red'
};

// Couleurs par statut pour le Gantt  
const statusColors = {
  todo: 'muted',
  doing: 'tech-blue',
  blocked: 'destructive', 
  done: 'success'
};

const GanttChart = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const { tasks, loading, error, updateTaskDates } = useTasks();
  
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [resizeTask, setResizeTask] = useState<{ taskId: string; side: 'left' | 'right' } | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; originalStartDate: Date; originalEndDate: Date } | null>(null);

  const chartRef = useRef<HTMLDivElement>(null);

  // Configuration dynamique selon la vue
  const getViewConfig = () => {
    switch (viewMode) {
      case 'day':
        return { 
          unitWidth: 40, 
          headerHeight: 80,
          getUnit: (date: Date) => date.getDate().toString(),
          getSubUnit: (date: Date) => date.toLocaleDateString('fr-FR', { month: 'short' }),
          unitDuration: 1 // 1 jour
        };
      case 'week':
        return { 
          unitWidth: 120, 
          headerHeight: 80,
          getUnit: (date: Date) => `S${Math.ceil(date.getDate() / 7)}`,
          getSubUnit: (date: Date) => date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
          unitDuration: 7 // 7 jours
        };
      case 'month':
        return { 
          unitWidth: 200, 
          headerHeight: 80,
          getUnit: (date: Date) => date.toLocaleDateString('fr-FR', { month: 'short' }),
          getSubUnit: (date: Date) => date.getFullYear().toString(),
          unitDuration: 30 // ~30 jours
        };
      default:
        return { unitWidth: 40, headerHeight: 80, getUnit: () => '', getSubUnit: () => '', unitDuration: 1 };
    }
  };

  const config = getViewConfig();
  const rowHeight = 60;
  
  // Calcul des dates selon la vue
  const startDate = new Date(2024, 0, 1);
  const endDate = new Date(2024, 11, 31); // Toute l'année pour avoir plus de données
  
  const getTotalUnits = () => {
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.ceil(totalDays / config.unitDuration);
  };

  const getUnitPosition = (date: Date) => {
    const days = Math.ceil((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const units = days / config.unitDuration;
    return units * config.unitWidth;
  };

  const getDateFromPosition = (x: number) => {
    const units = Math.floor(x / config.unitWidth);
    const days = units * config.unitDuration;
    return new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
  };

  // Fonction pour convertir une tâche DB en format Gantt
  const getGanttTask = (task: Task) => ({
    id: task.id,
    name: task.title,
    startDate: new Date(task.start_date),
    endDate: new Date(task.due_date),
    progress: task.progress,
    color: statusColors[task.status], // Utilise la couleur basée sur le statut
    assignee: task.assignee,
    priority: task.priority,
    status: task.status
  });

  const ganttTasks = tasks.map(getGanttTask);

  const getTaskWidth = (task: any) => {
    const duration = Math.ceil((task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24));
    return (duration / config.unitDuration) * config.unitWidth;
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, taskId: string, action: 'drag' | 'resize-left' | 'resize-right') => {
    e.preventDefault();
    const task = ganttTasks.find(t => t.id === taskId);
    if (!task) return;

    setDragStart({
      x: e.clientX,
      originalStartDate: new Date(task.startDate),
      originalEndDate: new Date(task.endDate)
    });

    if (action === 'drag') {
      setDraggedTask(taskId);
    } else if (action === 'resize-left' || action === 'resize-right') {
      setResizeTask({ taskId, side: action === 'resize-left' ? 'left' : 'right' });
    }
  }, [ganttTasks]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStart) return;
    // Pour l'aperçu visuel, on peut manipuler directement les tâches Gantt
    // mais on ne sauvegarde qu'au mouseUp
  }, [dragStart]);

  const handleMouseUp = useCallback(async () => {
    if (!dragStart) return;
    
    try {
      // Pour cette version simplifiée, on ne fait rien au mouseUp
      // Les modifications de dates peuvent être ajoutées plus tard
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setDraggedTask(null);
      setResizeTask(null);
      setDragStart(null);
    }
  }, [dragStart, draggedTask, resizeTask, ganttTasks, config, updateTaskDates]);

  React.useEffect(() => {
    if (draggedTask || resizeTask) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedTask, resizeTask, handleMouseMove, handleMouseUp]);

  // Loading et error states
  if (loading) {
    return (
      <Card className="w-full bg-card border-border">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Chargement du diagramme de Gantt...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full bg-card border-border">
        <CardContent className="p-8">
          <div className="text-center text-destructive">
            <p>Erreur lors du chargement du diagramme</p>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderTimelineHeader = () => {
    const units = [];
    const totalUnits = getTotalUnits();
    
    for (let i = 0; i < totalUnits; i++) {
      const date = new Date(startDate.getTime() + i * config.unitDuration * 24 * 60 * 60 * 1000);
      units.push(
        <div
          key={i}
          className="flex h-full items-center justify-center border-r border-gantt-grid text-xs text-muted-foreground"
          style={{ minWidth: config.unitWidth }}
        >
          <div className="text-center">
            <div className="font-medium">{config.getUnit(date)}</div>
            <div className="text-xs opacity-60">
              {config.getSubUnit(date)}
            </div>
          </div>
        </div>
      );
    }
    return units;
  };

  const renderTaskBar = (task: any, index: number) => {
    const left = getUnitPosition(task.startDate);
    const width = getTaskWidth(task);
    const isDragging = draggedTask === task.id;
    const isResizing = resizeTask?.taskId === task.id;

    return (
      <div
        key={task.id}
        className="absolute"
        style={{
          top: index * rowHeight + 10,
          left: left,
          width: width,
          height: rowHeight - 20
        }}
      >
        {/* Barre de tâche principale */}
        <div
          className={`relative h-full rounded-lg border group overflow-hidden ${
            isDragging || isResizing ? 'shadow-lg scale-105 z-10' : 'hover:shadow-md'
          } transition-all duration-200`}
          style={{
            backgroundColor: `hsl(var(--${task.color}))`,
            borderColor: `hsl(var(--${task.color}))`
          }}
        >
          {/* Barre de progression */}
          <div
            className="h-full rounded-lg opacity-30"
            style={{
              width: `${task.progress}%`,
              backgroundColor: `hsl(var(--${task.color}))`
            }}
          />
          
          {/* Poignée de redimensionnement gauche */}
          <div
            className="absolute left-0 top-0 h-full w-4 cursor-ew-resize bg-white/10 opacity-0 group-hover:opacity-100 hover:!opacity-100 hover:bg-white/30 transition-all flex items-center justify-center border-r border-white/20"
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleMouseDown(e, task.id, 'resize-left');
            }}
            title="Redimensionner le début"
          >
            <div className="w-0.5 h-8 bg-white rounded opacity-80" />
          </div>
          
          {/* Poignée de redimensionnement droite */}
          <div
            className="absolute right-0 top-0 h-full w-4 cursor-ew-resize bg-white/10 opacity-0 group-hover:opacity-100 hover:!opacity-100 hover:bg-white/30 transition-all flex items-center justify-center border-l border-white/20"
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleMouseDown(e, task.id, 'resize-right');
            }}
            title="Redimensionner la fin"
          >
            <div className="w-0.5 h-8 bg-white rounded opacity-80" />
          </div>
          
          {/* Zone de déplacement centrale */}
          <div 
            className="absolute inset-x-4 inset-y-0 cursor-move flex items-center px-2"
            onMouseDown={(e) => handleMouseDown(e, task.id, 'drag')}
            title="Déplacer la tâche"
          >
            <span className="text-sm font-medium text-white truncate pointer-events-none">
              {task.name}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full bg-card border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground">Diagramme de Gantt Interactif</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('day')}
              className="gap-1"
            >
              <Clock className="h-4 w-4" />
              Jour
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
              className="gap-1"
            >
              <CalendarDays className="h-4 w-4" />
              Semaine
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('month')}
              className="gap-1"
            >
              <Calendar className="h-4 w-4" />
              Mois
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex">
          {/* Colonne des noms de tâches */}
          <div className="w-64 bg-gantt-header border-r border-gantt-grid">
            <div className="h-20 flex items-center px-4 border-b border-gantt-grid">
              <span className="font-medium text-foreground">Tâches</span>
            </div>
            {ganttTasks.map((task, index) => (
              <div
                key={task.id}
                className="flex items-center px-4 border-b border-gantt-grid hover:bg-gantt-hover transition-colors"
                style={{ height: rowHeight }}
              >
                <div>
                  <div className="font-medium text-foreground">{task.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {task.progress}% complété - {task.assignee}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Zone du diagramme */}
          <div className="flex-1 overflow-x-auto">
            <div ref={chartRef} className="relative bg-background">
              {/* En-tête de la timeline */}
              <div 
                className="flex border-b border-gantt-grid bg-gantt-header" 
                style={{ height: config.headerHeight }}
              >
                {renderTimelineHeader()}
              </div>

              {/* Grille de fond */}
              <div className="relative" style={{ height: ganttTasks.length * rowHeight }}>
                {/* Lignes horizontales */}
                {ganttTasks.map((_, index) => (
                  <div
                    key={index}
                    className="absolute w-full border-b border-gantt-grid"
                    style={{ top: (index + 1) * rowHeight }}
                  />
                ))}

                {/* Lignes verticales */}
                {Array.from({ length: getTotalUnits() }).map((_, index) => (
                  <div
                    key={index}
                    className="absolute h-full border-r border-gantt-grid"
                    style={{ left: (index + 1) * config.unitWidth }}
                  />
                ))}

                {/* Barres de tâches */}
                {ganttTasks.map((task, index) => renderTaskBar(task, index))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GanttChart;