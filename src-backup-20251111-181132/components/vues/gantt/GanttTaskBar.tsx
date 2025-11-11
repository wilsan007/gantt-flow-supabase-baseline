import React from 'react';
import { GanttTask, ViewConfig, getUnitPosition, getTaskWidth } from '@/lib/ganttHelpers';
import { darkenColor, lightenColor } from '@/lib/ganttColors';

interface GanttTaskBarProps {
  task: GanttTask;
  index: number;
  rowHeight: number;
  startDate: Date;
  config: ViewConfig;
  isDragging: boolean;
  isResizing: boolean;
  onMouseDown: (
    e: React.MouseEvent,
    taskId: string,
    action: 'drag' | 'resize-left' | 'resize-right'
  ) => void;
}

export const GanttTaskBar = ({
  task,
  index,
  rowHeight,
  startDate,
  config,
  isDragging,
  isResizing,
  onMouseDown,
}: GanttTaskBarProps) => {
  const left = getUnitPosition(task.startDate, startDate, config);
  const width = getTaskWidth(task, config);

  // Couleurs pour la progression
  const baseColor = task.color;
  const completedColor = darkenColor(baseColor, 20); // Partie complétée plus foncée
  const remainingColor = lightenColor(baseColor, 40); // Partie restante plus claire

  return (
    <div
      data-task-id={task.id}
      className="absolute"
      style={{
        top: index * rowHeight + 10,
        left: left,
        width: width,
        height: rowHeight - 20,
      }}
    >
      <div
        className={`group relative h-full overflow-hidden rounded-lg border-2 ${
          isDragging || isResizing ? 'z-10 scale-105 shadow-lg' : 'hover:shadow-md'
        } shadow-sm transition-all duration-200`}
        style={{
          backgroundColor: remainingColor, // Fond = partie non complétée
          borderColor: baseColor,
        }}
      >
        {/* Partie complétée (progression) */}
        <div
          className="h-full rounded-l-lg transition-all duration-300"
          style={{
            width: `${task.progress}%`,
            backgroundColor: completedColor,
          }}
        />

        <div
          className="absolute left-0 top-0 flex h-full w-4 cursor-ew-resize items-center justify-center border-r border-white/30 bg-white/20 opacity-0 transition-all hover:bg-white/40 hover:!opacity-100 group-hover:opacity-100 dark:bg-white/10 dark:hover:bg-white/30"
          onMouseDown={e => {
            e.stopPropagation();
            e.preventDefault();
            onMouseDown(e, task.id, 'resize-left');
          }}
          title="Redimensionner le début"
        >
          <div className="h-8 w-0.5 rounded bg-white opacity-90" />
        </div>

        <div
          className="absolute right-0 top-0 flex h-full w-4 cursor-ew-resize items-center justify-center border-l border-white/30 bg-white/20 opacity-0 transition-all hover:bg-white/40 hover:!opacity-100 group-hover:opacity-100 dark:bg-white/10 dark:hover:bg-white/30"
          onMouseDown={e => {
            e.stopPropagation();
            e.preventDefault();
            onMouseDown(e, task.id, 'resize-right');
          }}
          title="Redimensionner la fin"
        >
          <div className="h-8 w-0.5 rounded bg-white opacity-90" />
        </div>

        <div
          className="absolute inset-x-4 inset-y-0 flex cursor-move items-center justify-center px-2"
          onMouseDown={e => onMouseDown(e, task.id, 'drag')}
          title="Déplacer la tâche"
        >
          {/* Taux de progression en gras et gros - centré */}
          <span className="pointer-events-none whitespace-nowrap text-2xl font-extrabold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] dark:text-white">
            {task.progress}%
          </span>
        </div>
      </div>
    </div>
  );
};
