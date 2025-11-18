import React from 'react';
import { GanttTask, ViewConfig, getTotalUnits } from '@/lib/ganttHelpers';
import { GanttTaskBar } from './GanttTaskBar';

interface GanttTimelineProps {
  tasks: GanttTask[];
  config: ViewConfig;
  startDate: Date;
  endDate: Date;
  rowHeight: number;
  draggedTask: string | null;
  resizeTask: { taskId: string; side: 'left' | 'right' } | null;
  onTaskMouseDown: (
    e: React.MouseEvent,
    taskId: string,
    action: 'drag' | 'resize-left' | 'resize-right'
  ) => void;
  displayMode?: 'tasks' | 'projects';
}

export const GanttTimeline = ({
  tasks,
  config,
  startDate,
  endDate,
  rowHeight,
  draggedTask,
  resizeTask,
  onTaskMouseDown,
  displayMode = 'tasks',
}: GanttTimelineProps) => {
  const totalUnits = getTotalUnits(startDate, endDate, config);

  // Calculer l'index réel de chaque tâche en tenant compte des headers de projet
  const getTaskRealIndex = (taskId: string): number => {
    if (displayMode === 'projects') {
      return tasks.findIndex(t => t.id === taskId);
    }

    // Regrouper par project_id (pas project_name)
    const groupedTasks = tasks.reduce((groups: { [key: string]: GanttTask[] }, task) => {
      const projectKey = task.project_id || 'no-project';
      if (!groups[projectKey]) {
        groups[projectKey] = [];
      }
      groups[projectKey].push(task);
      return groups;
    }, {});

    let currentIndex = 0;
    for (const [projectKey, projectTasks] of Object.entries(groupedTasks)) {
      // +1 pour le header du projet
      currentIndex++;

      const taskIndex = projectTasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        return currentIndex + taskIndex;
      }

      currentIndex += projectTasks.length;
    }
    return 0;
  };

  const renderTimelineHeader = () => {
    const units = [];
    let currentDate = new Date(startDate);

    for (let i = 0; i < totalUnits; i++) {
      // Pour le mode mois, avancer d'un mois à la fois
      if (config.unitDuration === 30) {
        currentDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      } else {
        currentDate = new Date(startDate.getTime() + i * config.unitDuration * 24 * 60 * 60 * 1000);
      }

      units.push(
        <div
          key={i}
          className="border-gantt-grid text-foreground/70 flex h-full items-center justify-center border-r text-xs"
          style={{ minWidth: config.unitWidth }}
        >
          <div className="text-center">
            <div className="text-foreground font-medium">{config.getUnit(currentDate)}</div>
            <div className="text-foreground/60 text-xs opacity-60">
              {config.getSubUnit(currentDate)}
            </div>
          </div>
        </div>
      );
    }
    return units;
  };

  // Calculer la hauteur totale en tenant compte des headers de projet
  const getTotalHeight = (): number => {
    if (displayMode === 'projects') {
      return tasks.length * rowHeight;
    }

    // Compter le nombre de projets + tâches (grouper par project_id)
    const groupedTasks = tasks.reduce((groups: { [key: string]: GanttTask[] }, task) => {
      const projectKey = task.project_id || 'no-project';
      if (!groups[projectKey]) {
        groups[projectKey] = [];
      }
      groups[projectKey].push(task);
      return groups;
    }, {});

    const projectCount = Object.keys(groupedTasks).length;
    return (projectCount + tasks.length) * rowHeight;
  };

  return (
    <div className="h-full w-full">
      <div
        className="gantt-chart bg-gantt-task-bg/60 relative backdrop-blur-sm"
        style={{
          minWidth: totalUnits * config.unitWidth,
          height: getTotalHeight(),
        }}
      >
        {/* Lignes horizontales - une par ligne (projets + tâches) */}
        {Array.from({ length: Math.ceil(getTotalHeight() / rowHeight) }).map((_, index) => (
          <div
            key={index}
            className="border-gantt-grid/60 absolute w-full border-b"
            style={{ top: (index + 1) * rowHeight }}
          />
        ))}

        {Array.from({ length: totalUnits }).map((_, index) => (
          <div
            key={index}
            className="border-gantt-grid/60 absolute h-full border-r"
            style={{ left: (index + 1) * config.unitWidth }}
          />
        ))}

        {tasks.map(task => (
          <GanttTaskBar
            key={task.id}
            task={task}
            index={getTaskRealIndex(task.id)}
            rowHeight={rowHeight}
            startDate={startDate}
            config={config}
            isDragging={draggedTask === task.id}
            isResizing={resizeTask?.taskId === task.id}
            onMouseDown={onTaskMouseDown}
          />
        ))}
      </div>
    </div>
  );
};
