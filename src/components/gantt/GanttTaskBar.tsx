import React from 'react';
import { GanttTask, ViewConfig, getUnitPosition, getTaskWidth } from '@/lib/ganttHelpers';

interface GanttTaskBarProps {
  task: GanttTask;
  index: number;
  rowHeight: number;
  startDate: Date;
  config: ViewConfig;
  isDragging: boolean;
  isResizing: boolean;
  onMouseDown: (e: React.MouseEvent, taskId: string, action: 'drag' | 'resize-left' | 'resize-right') => void;
}

export const GanttTaskBar = ({ 
  task, 
  index, 
  rowHeight, 
  startDate, 
  config, 
  isDragging, 
  isResizing, 
  onMouseDown 
}: GanttTaskBarProps) => {
  const left = getUnitPosition(task.startDate, startDate, config);
  const width = getTaskWidth(task, config);

  return (
    <div
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
        } transition-all duration-200 shadow-sm`}
        style={{
          backgroundColor: `hsl(var(--${task.color}))`,
          borderColor: `hsl(var(--${task.color}))`,
          opacity: 0.9
        }}
      >
        <div
          className="h-full rounded-lg"
          style={{
            width: `${task.progress}%`,
            backgroundColor: `hsl(var(--${task.color}))`,
            opacity: 0.3
          }}
        />
        
        <div
          className="absolute left-0 top-0 h-full w-4 cursor-ew-resize bg-white/20 dark:bg-white/10 opacity-0 group-hover:opacity-100 hover:!opacity-100 hover:bg-white/40 dark:hover:bg-white/30 transition-all flex items-center justify-center border-r border-white/30"
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onMouseDown(e, task.id, 'resize-left');
          }}
          title="Redimensionner le début"
        >
          <div className="w-0.5 h-8 bg-white rounded opacity-90" />
        </div>
        
        <div
          className="absolute right-0 top-0 h-full w-4 cursor-ew-resize bg-white/20 dark:bg-white/10 opacity-0 group-hover:opacity-100 hover:!opacity-100 hover:bg-white/40 dark:hover:bg-white/30 transition-all flex items-center justify-center border-l border-white/30"
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onMouseDown(e, task.id, 'resize-right');
          }}
          title="Redimensionner la fin"
        >
          <div className="w-0.5 h-8 bg-white rounded opacity-90" />
        </div>
        
        <div 
          className="absolute inset-x-4 inset-y-0 cursor-move flex items-center px-2"
          onMouseDown={(e) => onMouseDown(e, task.id, 'drag')}
          title="Déplacer la tâche"
        >
          <span className="text-sm font-medium truncate pointer-events-none text-white dark:text-white drop-shadow-sm">
            {task.name}
          </span>
        </div>
      </div>
    </div>
  );
};