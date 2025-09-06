import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Task {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  color: string;
}

const GanttChart = () => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      name: 'Design UI/UX',
      startDate: new Date(2024, 0, 1),
      endDate: new Date(2024, 0, 15),
      progress: 80,
      color: 'tech-blue'
    },
    {
      id: '2',
      name: 'Développement Frontend',
      startDate: new Date(2024, 0, 10),
      endDate: new Date(2024, 1, 5),
      progress: 45,
      color: 'tech-purple'
    },
    {
      id: '3',
      name: 'Backend API',
      startDate: new Date(2024, 0, 20),
      endDate: new Date(2024, 1, 10),
      progress: 30,
      color: 'tech-cyan'
    },
    {
      id: '4',
      name: 'Tests & Déploiement',
      startDate: new Date(2024, 1, 5),
      endDate: new Date(2024, 1, 20),
      progress: 10,
      color: 'success'
    }
  ]);

  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [resizeTask, setResizeTask] = useState<{ taskId: string; side: 'left' | 'right' } | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; originalStartDate: Date; originalEndDate: Date } | null>(null);

  const chartRef = useRef<HTMLDivElement>(null);

  // Configuration
  const dayWidth = 40;
  const rowHeight = 60;
  const headerHeight = 80;
  
  // Calcul des dates
  const startDate = new Date(2024, 0, 1);
  const endDate = new Date(2024, 2, 31);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const getDayPosition = (date: Date) => {
    const days = Math.ceil((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return days * dayWidth;
  };

  const getDateFromPosition = (x: number) => {
    const days = Math.floor(x / dayWidth);
    return new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
  };

  const getTaskWidth = (task: Task) => {
    const duration = Math.ceil((task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24));
    return duration * dayWidth;
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, taskId: string, action: 'drag' | 'resize-left' | 'resize-right') => {
    e.preventDefault();
    const task = tasks.find(t => t.id === taskId);
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
  }, [tasks]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStart) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaDays = Math.round(deltaX / dayWidth);

    if (draggedTask) {
      // Déplacement de la tâche
      setTasks(prev => prev.map(task => {
        if (task.id === draggedTask) {
          const duration = task.endDate.getTime() - task.startDate.getTime();
          const newStartDate = new Date(dragStart.originalStartDate.getTime() + deltaDays * 24 * 60 * 60 * 1000);
          const newEndDate = new Date(newStartDate.getTime() + duration);
          return { ...task, startDate: newStartDate, endDate: newEndDate };
        }
        return task;
      }));
    } else if (resizeTask) {
      // Redimensionnement de la tâche
      setTasks(prev => prev.map(task => {
        if (task.id === resizeTask.taskId) {
          if (resizeTask.side === 'left') {
            const newStartDate = new Date(dragStart.originalStartDate.getTime() + deltaDays * 24 * 60 * 60 * 1000);
            if (newStartDate < task.endDate) {
              return { ...task, startDate: newStartDate };
            }
          } else {
            const newEndDate = new Date(dragStart.originalEndDate.getTime() + deltaDays * 24 * 60 * 60 * 1000);
            if (newEndDate > task.startDate) {
              return { ...task, endDate: newEndDate };
            }
          }
        }
        return task;
      }));
    }
  }, [dragStart, draggedTask, resizeTask, dayWidth]);

  const handleMouseUp = useCallback(() => {
    setDraggedTask(null);
    setResizeTask(null);
    setDragStart(null);
  }, []);

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

  const renderTimelineHeader = () => {
    const days = [];
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      days.push(
        <div
          key={i}
          className="flex h-full items-center justify-center border-r border-gantt-grid text-xs text-muted-foreground"
          style={{ minWidth: dayWidth }}
        >
          <div className="text-center">
            <div className="font-medium">{date.getDate()}</div>
            <div className="text-xs opacity-60">
              {date.toLocaleDateString('fr-FR', { month: 'short' })}
            </div>
          </div>
        </div>
      );
    }
    return days;
  };

  const renderTaskBar = (task: Task, index: number) => {
    const left = getDayPosition(task.startDate);
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
          className={`relative h-full rounded-lg border cursor-move transition-all duration-200 ${
            isDragging || isResizing ? 'shadow-lg scale-105' : 'hover:shadow-md'
          }`}
          style={{
            backgroundColor: `hsl(var(--${task.color}))`,
            borderColor: `hsl(var(--${task.color}))`
          }}
          onMouseDown={(e) => handleMouseDown(e, task.id, 'drag')}
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
            className="absolute left-0 top-0 h-full w-2 cursor-ew-resize opacity-0 hover:opacity-100 transition-opacity"
            style={{ backgroundColor: `hsl(var(--${task.color}))` }}
            onMouseDown={(e) => handleMouseDown(e, task.id, 'resize-left')}
          />
          
          {/* Poignée de redimensionnement droite */}
          <div
            className="absolute right-0 top-0 h-full w-2 cursor-ew-resize opacity-0 hover:opacity-100 transition-opacity"
            style={{ backgroundColor: `hsl(var(--${task.color}))` }}
            onMouseDown={(e) => handleMouseDown(e, task.id, 'resize-right')}
          />
          
          {/* Texte de la tâche */}
          <div className="absolute inset-0 flex items-center px-3">
            <span className="text-sm font-medium text-white truncate">
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
        <CardTitle className="text-foreground">Diagramme de Gantt Interactif</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex">
          {/* Colonne des noms de tâches */}
          <div className="w-64 bg-gantt-header border-r border-gantt-grid">
            <div className="h-20 flex items-center px-4 border-b border-gantt-grid">
              <span className="font-medium text-foreground">Tâches</span>
            </div>
            {tasks.map((task, index) => (
              <div
                key={task.id}
                className="flex items-center px-4 border-b border-gantt-grid hover:bg-gantt-hover transition-colors"
                style={{ height: rowHeight }}
              >
                <div>
                  <div className="font-medium text-foreground">{task.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {task.progress}% complété
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Zone du diagramme */}
          <div className="flex-1 overflow-x-auto">
            <div ref={chartRef} className="relative bg-background">
              {/* En-tête de la timeline */}
              <div className="flex border-b border-gantt-grid bg-gantt-header" style={{ height: headerHeight }}>
                {renderTimelineHeader()}
              </div>

              {/* Grille de fond */}
              <div className="relative" style={{ height: tasks.length * rowHeight }}>
                {/* Lignes horizontales */}
                {tasks.map((_, index) => (
                  <div
                    key={index}
                    className="absolute w-full border-b border-gantt-grid"
                    style={{ top: (index + 1) * rowHeight }}
                  />
                ))}

                {/* Lignes verticales */}
                {Array.from({ length: totalDays }).map((_, index) => (
                  <div
                    key={index}
                    className="absolute h-full border-r border-gantt-grid"
                    style={{ left: (index + 1) * dayWidth }}
                  />
                ))}

                {/* Barres de tâches */}
                {tasks.map((task, index) => renderTaskBar(task, index))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GanttChart;