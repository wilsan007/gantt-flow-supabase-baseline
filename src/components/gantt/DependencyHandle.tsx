import React from 'react';
import { cn } from '@/lib/utils';

interface DependencyHandleProps {
  position: 'start' | 'end';
  taskId: string;
  onDragStart: (taskId: string, position: 'start' | 'end') => void;
  className?: string;
}

/**
 * Crochet (handle) pour créer des dépendances entre tâches
 * Apparaît au début ou à la fin d'une barre de tâche
 */
export const DependencyHandle: React.FC<DependencyHandleProps> = ({
  position,
  taskId,
  onDragStart,
  className,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDragStart(taskId, position);
  };

  return (
    <div
      className={cn(
        'dependency-handle absolute top-1/2 z-20 -translate-y-1/2',
        'cursor-grab transition-all duration-200 active:cursor-grabbing',
        'opacity-60 hover:opacity-100 group-hover:opacity-100',
        position === 'start' ? '-left-5' : '-right-5',
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-task-id={taskId}
      data-position={position}
      title={
        position === 'start'
          ? 'Tirer pour créer une dépendance depuis le début'
          : 'Tirer pour créer une dépendance depuis la fin'
      }
    >
      {/* Crochet SVG visible qui sort de la barre */}
      <svg
        width="28"
        height="36"
        viewBox="0 0 28 36"
        className={cn(
          'transition-all duration-200',
          isHovered && 'drop-shadow-[0_4px_12px_rgba(59,130,246,0.5)]'
        )}
        style={{
          transform: position === 'start' ? 'scaleX(-1)' : 'scaleX(1)',
        }}
      >
        {/* Fond blanc pour contraste */}
        <path
          d="M 6 10 L 6 26 Q 6 30 10 30 L 20 30"
          fill="none"
          stroke="white"
          strokeWidth="7"
          strokeLinecap="round"
        />

        {/* Crochet coloré */}
        <path
          d="M 6 10 L 6 26 Q 6 30 10 30 L 20 30"
          fill="none"
          stroke={isHovered ? '#3b82f6' : '#6b7280'}
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Cercle à l'extrémité pour faciliter le clic */}
        <circle
          cx="20"
          cy="30"
          r={isHovered ? '6' : '5'}
          fill={isHovered ? '#3b82f6' : '#6b7280'}
          stroke="white"
          strokeWidth="2"
          className="transition-all duration-200"
        />

        {/* Indicateur visuel au centre */}
        <circle
          cx="6"
          cy="18"
          r={isHovered ? '5' : '4'}
          fill={isHovered ? '#3b82f6' : '#94a3b8'}
          stroke="white"
          strokeWidth="1.5"
          className="transition-all duration-200"
        />
      </svg>
    </div>
  );
};
