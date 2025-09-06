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
  onTaskMouseDown: (e: React.MouseEvent, taskId: string, action: 'drag' | 'resize-left' | 'resize-right') => void;
}

export const GanttTimeline = ({ 
  tasks, 
  config, 
  startDate, 
  endDate, 
  rowHeight, 
  draggedTask, 
  resizeTask, 
  onTaskMouseDown 
}: GanttTimelineProps) => {
  const totalUnits = getTotalUnits(startDate, endDate, config);

  const renderTimelineHeader = () => {
    const units = [];
    
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

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden">
      <div 
        className="gantt-chart relative bg-background"
        style={{ minWidth: totalUnits * config.unitWidth }}
      >
        <div 
          className="flex border-b border-border bg-muted/30 sticky top-0 z-10" 
          style={{ 
            height: config.headerHeight,
            minWidth: totalUnits * config.unitWidth 
          }}
        >
          {renderTimelineHeader()}
        </div>

        <div 
          className="relative" 
          style={{ 
            height: tasks.length * rowHeight,
            minWidth: totalUnits * config.unitWidth 
          }}
        >
          {tasks.map((_, index) => (
            <div
              key={index}
              className="absolute w-full border-b border-border"
              style={{ top: (index + 1) * rowHeight }}
            />
          ))}

          {Array.from({ length: totalUnits }).map((_, index) => (
            <div
              key={index}
              className="absolute h-full border-r border-border"
              style={{ left: (index + 1) * config.unitWidth }}
            />
          ))}

          {tasks.map((task, index) => (
            <GanttTaskBar
              key={task.id}
              task={task}
              index={index}
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
    </div>
  );
};