import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarDays, Clock, Loader2 } from 'lucide-react';
import { useTasks, Task } from '@/hooks/useTasks';

type ViewMode = 'day' | 'week' | 'month';

// Couleurs par statut pour le Gantt  
const statusColors = {
  todo: 'muted-foreground',
  doing: 'tech-blue',
  blocked: 'tech-red', 
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
  const endDate = new Date(2024, 11, 31);
  
  const getTotalUnits = () => {
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.ceil(totalDays / config.unitDuration);
  };

  const getUnitPosition = (date: Date) => {
    const days = Math.ceil((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const units = days / config.unitDuration;
    return units * config.unitWidth;
  };

  // Fonction pour convertir une tâche DB en format Gantt
  const getGanttTask = (task: Task) => ({
    id: task.id,
    name: task.title,
    startDate: new Date(task.start_date),
    endDate: new Date(task.due_date),
    progress: task.progress,
    color: statusColors[task.status],
    assignee: task.assignee,
    priority: task.priority,
    status: task.status
  });

  const ganttTasks = tasks.map(getGanttTask);

  const getTaskWidth = (task: any) => {
    const duration = Math.ceil((task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24));
    return (duration / config.unitDuration) * config.unitWidth;
  };

  const taskMouseDownHandler = useCallback((e: React.MouseEvent, taskId: string, action: 'drag' | 'resize-left' | 'resize-right') => {
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
    if (!dragStart || !chartRef.current) return;
    
    const deltaX = e.clientX - dragStart.x;
    const daysDelta = Math.round(deltaX / (config.unitWidth / config.unitDuration));
    const timeDelta = daysDelta * 24 * 60 * 60 * 1000;
    
    if (draggedTask) {
      // Déplacement de la tâche entière
      const originalTask = tasks.find(t => t.id === draggedTask);
      if (originalTask) {
        const newStartDate = new Date(dragStart.originalStartDate.getTime() + timeDelta);
        const newEndDate = new Date(dragStart.originalEndDate.getTime() + timeDelta);
        
        // Mise à jour visuelle immédiate via le DOM pour un feedback fluide
        const taskElement = document.querySelector(`[data-task-id="${draggedTask}"]`);
        if (taskElement) {
          const left = getUnitPosition(newStartDate);
          (taskElement as HTMLElement).style.left = `${left}px`;
        }
      }
    } else if (resizeTask) {
      // Redimensionnement de la tâche
      const originalTask = tasks.find(t => t.id === resizeTask.taskId);
      if (originalTask) {
        let newStartDate = dragStart.originalStartDate;
        let newEndDate = dragStart.originalEndDate;
        
        if (resizeTask.side === 'left') {
          newStartDate = new Date(dragStart.originalStartDate.getTime() + timeDelta);
          // Assurer que la date de début n'est pas après la date de fin
          if (newStartDate >= newEndDate) {
            newStartDate = new Date(newEndDate.getTime() - 24 * 60 * 60 * 1000);
          }
        } else {
          newEndDate = new Date(dragStart.originalEndDate.getTime() + timeDelta);
          // Assurer que la date de fin n'est pas avant la date de début
          if (newEndDate <= newStartDate) {
            newEndDate = new Date(newStartDate.getTime() + 24 * 60 * 60 * 1000);
          }
        }
        
        // Mise à jour visuelle immédiate
        const taskElement = document.querySelector(`[data-task-id="${resizeTask.taskId}"]`);
        if (taskElement) {
          const left = getUnitPosition(newStartDate);
          const width = getTaskWidth({ startDate: newStartDate, endDate: newEndDate });
          (taskElement as HTMLElement).style.left = `${left}px`;
          (taskElement as HTMLElement).style.width = `${width}px`;
        }
      }
    }
  }, [dragStart, draggedTask, resizeTask, config, tasks, getUnitPosition, getTaskWidth]);

  const handleMouseUp = useCallback(async () => {
    if (!dragStart) return;
    
    try {
      const deltaX = document.querySelector('.gantt-chart')?.scrollLeft || 0;
      const daysDelta = Math.round((dragStart.x + deltaX) / (config.unitWidth / config.unitDuration));
      const timeDelta = daysDelta * 24 * 60 * 60 * 1000;
      
      if (draggedTask) {
        const originalTask = tasks.find(t => t.id === draggedTask);
        if (originalTask && updateTaskDates) {
          const newStartDate = new Date(dragStart.originalStartDate.getTime() + timeDelta);
          const newEndDate = new Date(dragStart.originalEndDate.getTime() + timeDelta);
          
          await updateTaskDates(draggedTask, 
            newStartDate.toISOString().split('T')[0], 
            newEndDate.toISOString().split('T')[0]
          );
        }
      } else if (resizeTask) {
        const originalTask = tasks.find(t => t.id === resizeTask.taskId);
        if (originalTask && updateTaskDates) {
          let newStartDate = dragStart.originalStartDate;
          let newEndDate = dragStart.originalEndDate;
          
          if (resizeTask.side === 'left') {
            newStartDate = new Date(dragStart.originalStartDate.getTime() + timeDelta);
            if (newStartDate >= newEndDate) {
              newStartDate = new Date(newEndDate.getTime() - 24 * 60 * 60 * 1000);
            }
          } else {
            newEndDate = new Date(dragStart.originalEndDate.getTime() + timeDelta);
            if (newEndDate <= newStartDate) {
              newEndDate = new Date(newStartDate.getTime() + 24 * 60 * 60 * 1000);
            }
          }
          
          await updateTaskDates(resizeTask.taskId,
            newStartDate.toISOString().split('T')[0],
            newEndDate.toISOString().split('T')[0]
          );
        }
      }
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setDraggedTask(null);
      setResizeTask(null);
      setDragStart(null);
    }
  }, [dragStart, draggedTask, resizeTask, config, tasks, updateTaskDates]);

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
          className="flex h-full items-center justify-center border-r border-border text-xs text-muted-foreground"
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
        data-task-id={task.id}
        className="absolute"
        style={{
          top: index * rowHeight + 10,
          left: left,
          width: width,
          height: rowHeight - 20
        }}
      >
        <div
          className={`relative h-full rounded-lg border group overflow-hidden ${
            isDragging || isResizing ? 'shadow-lg scale-105 z-10' : 'hover:shadow-md'
          } transition-all duration-200`}
          style={{
            backgroundColor: `hsl(var(--${task.color}))`,
            borderColor: `hsl(var(--${task.color}))`,
            opacity: 0.8
          }}
        >
          <div
            className="h-full rounded-lg"
            style={{
              width: `${task.progress}%`,
              backgroundColor: `hsl(var(--${task.color}))`,
              opacity: 0.5
            }}
          />
          
          <div
            className="absolute left-0 top-0 h-full w-4 cursor-ew-resize bg-white/10 opacity-0 group-hover:opacity-100 hover:!opacity-100 hover:bg-white/30 transition-all flex items-center justify-center border-r border-white/20"
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              taskMouseDownHandler(e, task.id, 'resize-left');
            }}
            title="Redimensionner le début"
          >
            <div className="w-0.5 h-8 bg-white rounded opacity-80" />
          </div>
          
          <div
            className="absolute right-0 top-0 h-full w-4 cursor-ew-resize bg-white/10 opacity-0 group-hover:opacity-100 hover:!opacity-100 hover:bg-white/30 transition-all flex items-center justify-center border-l border-white/20"
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              taskMouseDownHandler(e, task.id, 'resize-right');
            }}
            title="Redimensionner la fin"
          >
            <div className="w-0.5 h-8 bg-white rounded opacity-80" />
          </div>
          
          <div 
            className="absolute inset-x-4 inset-y-0 cursor-move flex items-center px-2"
            onMouseDown={(e) => taskMouseDownHandler(e, task.id, 'drag')}
            title="Déplacer la tâche"
          >
            <span className="text-sm font-medium text-foreground truncate pointer-events-none mix-blend-difference">
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
          <div className="w-64 bg-muted/30 border-r border-border">
            <div className="h-20 flex items-center px-4 border-b border-border">
              <span className="font-medium text-foreground">Tâches</span>
            </div>
            {ganttTasks.map((task, index) => (
              <div
                key={task.id}
                className="flex items-center px-4 border-b border-border hover:bg-muted/50 transition-colors"
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

          <div className="flex-1 overflow-x-auto">
            <div ref={chartRef} className="gantt-chart relative bg-background">
              <div 
                className="flex border-b border-border bg-muted/30" 
                style={{ height: config.headerHeight }}
              >
                {renderTimelineHeader()}
              </div>

              <div className="relative" style={{ height: ganttTasks.length * rowHeight }}>
                {ganttTasks.map((_, index) => (
                  <div
                    key={index}
                    className="absolute w-full border-b border-border"
                    style={{ top: (index + 1) * rowHeight }}
                  />
                ))}

                {Array.from({ length: getTotalUnits() }).map((_, index) => (
                  <div
                    key={index}
                    className="absolute h-full border-r border-border"
                    style={{ left: (index + 1) * config.unitWidth }}
                  />
                ))}

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