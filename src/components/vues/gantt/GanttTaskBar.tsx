import React from 'react';
import { GanttTask, ViewConfig, getUnitPosition, getTaskWidth } from '@/lib/ganttHelpers';
import { darkenColor, lightenColor } from '@/lib/ganttColors';

interface GanttTaskBarProps {
  task: GanttTask;
  index: number; // Keep for compatibility but use verticalPosition if provided
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
  isSubtask?: boolean; // Si c'est une sous-tâche (pour affichage plus fin)
  verticalPosition?: number; // Position verticale cumulative calculée (en pixels)
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
  isSubtask = false,
  verticalPosition,
}: GanttTaskBarProps) => {
  const left = getUnitPosition(task.startDate, startDate, config);
  const width = getTaskWidth(task, config);

  // Couleurs pour la progression
  const baseColor = task.color;
  const completedColor = darkenColor(baseColor, 20); // Partie complétée plus foncée
  const remainingColor = lightenColor(baseColor, 40); // Partie restante plus claire

  // Ajuster la hauteur et l'épaisseur pour les sous-tâches
  // Pour garder la même proportion : padding = 16.6% de rowHeight
  const barPadding = isSubtask ? 7 : 10; // Proportion identique (7/42 ≈ 10/60)
  const barHeight = rowHeight - barPadding * 2;
  const borderWidth = isSubtask ? 1 : 2; // Bordure plus fine pour sous-tâches

  // Utiliser verticalPosition si fourni (pour alignement parfait avec hauteurs variables)
  const topPosition =
    verticalPosition !== undefined ? verticalPosition + barPadding : index * rowHeight + barPadding;

  return (
    <div
      data-task-id={task.id}
      className="absolute"
      style={{
        top: topPosition,
        left: left,
        width: width,
        height: barHeight,
      }}
    >
      <div
        className={`group relative h-full overflow-hidden rounded-lg ${
          isDragging || isResizing ? 'z-10 scale-105 shadow-lg' : 'hover:shadow-md'
        } shadow-sm transition-all duration-200`}
        style={{
          backgroundColor: remainingColor, // Fond = partie non complétée
          borderColor: baseColor,
          borderWidth: `${borderWidth}px`,
          borderStyle: 'solid',
          opacity: isSubtask ? 0.85 : 1, // Légèrement transparent pour sous-tâches
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
          className="absolute top-0 left-0 flex h-full w-4 cursor-ew-resize items-center justify-center border-r border-white/30 bg-white/20 opacity-0 transition-all group-hover:opacity-100 hover:bg-white/40 hover:!opacity-100 dark:bg-white/10 dark:hover:bg-white/30"
          onMouseDown={e => {
            e.stopPropagation();
            e.preventDefault();
            onMouseDown(e, task.id, 'resize-left');
          }}
          title="Redimensionner le début"
        >
          <div
            className="w-0.5 rounded bg-white opacity-90"
            style={{ height: isSubtask ? '1rem' : '2rem' }}
          />
        </div>

        <div
          className="absolute top-0 right-0 flex h-full w-4 cursor-ew-resize items-center justify-center border-l border-white/30 bg-white/20 opacity-0 transition-all group-hover:opacity-100 hover:bg-white/40 hover:!opacity-100 dark:bg-white/10 dark:hover:bg-white/30"
          onMouseDown={e => {
            e.stopPropagation();
            e.preventDefault();
            onMouseDown(e, task.id, 'resize-right');
          }}
          title="Redimensionner la fin"
        >
          <div
            className="w-0.5 rounded bg-white opacity-90"
            style={{ height: isSubtask ? '1rem' : '2rem' }}
          />
        </div>

        <div
          className="absolute inset-x-4 inset-y-0 flex cursor-move items-center justify-center px-2"
          onMouseDown={e => onMouseDown(e, task.id, 'drag')}
          title="Déplacer la tâche"
        >
          {/* Taux de progression en gras et gros - centré avec taille adaptée */}
          <span
            className="pointer-events-none font-extrabold whitespace-nowrap text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] dark:text-white"
            style={{ fontSize: isSubtask ? '1rem' : '1.5rem' }}
          >
            {task.progress}%
          </span>
        </div>
      </div>
    </div>
  );
};
