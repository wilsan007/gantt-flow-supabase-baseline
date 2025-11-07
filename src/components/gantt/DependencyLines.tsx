import React from 'react';
import { TaskDependency } from '@/types/taskDependencies';
import { X } from 'lucide-react';

interface TaskPosition {
  id: string;
  top: number;
  left: number;
  width: number;
  height: number;
}

interface DependencyLinesProps {
  dependencies: TaskDependency[];
  taskPositions: Map<string, TaskPosition>;
  onDeleteDependency?: (dependencyId: string) => void;
}

export const DependencyLines: React.FC<DependencyLinesProps> = ({
  dependencies,
  taskPositions,
  onDeleteDependency,
}) => {
  const [hoveredLine, setHoveredLine] = React.useState<string | null>(null);

  const calculatePath = (
    dependency: TaskDependency,
    fromPos: TaskPosition,
    toPos: TaskPosition
  ): string => {
    // Points de départ et d'arrivée selon le type de dépendance
    let startX: number, startY: number, endX: number, endY: number;

    const fromCenterY = fromPos.top + fromPos.height / 2;
    const toCenterY = toPos.top + toPos.height / 2;

    switch (dependency.dependency_type) {
      case 'finish-to-start':
        // De la fin de la tâche prédécesseur au début de la successeur
        startX = fromPos.left + fromPos.width;
        startY = fromCenterY;
        endX = toPos.left;
        endY = toCenterY;
        break;

      case 'start-to-start':
        // Du début au début
        startX = fromPos.left;
        startY = fromCenterY;
        endX = toPos.left;
        endY = toCenterY;
        break;

      case 'finish-to-finish':
        // De la fin à la fin
        startX = fromPos.left + fromPos.width;
        startY = fromCenterY;
        endX = toPos.left + toPos.width;
        endY = toCenterY;
        break;

      case 'start-to-finish':
        // Du début à la fin
        startX = fromPos.left;
        startY = fromCenterY;
        endX = toPos.left + toPos.width;
        endY = toCenterY;
        break;

      default:
        startX = fromPos.left + fromPos.width;
        startY = fromCenterY;
        endX = toPos.left;
        endY = toCenterY;
    }

    // Créer un chemin avec des courbes pour éviter les autres tâches
    const midX = (startX + endX) / 2;
    const horizontalGap = 20;
    const verticalGap = 10;

    // Si les tâches se chevauchent verticalement, ajouter un détour
    const tasksOverlap =
      fromPos.top < toPos.top + toPos.height && toPos.top < fromPos.top + fromPos.height;

    if (tasksOverlap && startX > endX) {
      // Détour par le bas ou le haut
      const detourY =
        Math.max(fromPos.top + fromPos.height, toPos.top + toPos.height) + verticalGap;

      return `
        M ${startX} ${startY}
        L ${startX + horizontalGap} ${startY}
        L ${startX + horizontalGap} ${detourY}
        L ${endX - horizontalGap} ${detourY}
        L ${endX - horizontalGap} ${endY}
        L ${endX} ${endY}
      `;
    } else {
      // Chemin simple avec courbes
      const controlPoint1X = startX + (endX - startX) * 0.3;
      const controlPoint2X = startX + (endX - startX) * 0.7;

      return `
        M ${startX} ${startY}
        C ${controlPoint1X} ${startY}, ${controlPoint2X} ${endY}, ${endX} ${endY}
      `;
    }
  };

  const getLineColor = (type: string): string => {
    switch (type) {
      case 'finish-to-start':
        return '#3b82f6'; // blue
      case 'start-to-start':
        return '#10b981'; // green
      case 'finish-to-finish':
        return '#f59e0b'; // amber
      case 'start-to-finish':
        return '#8b5cf6'; // violet
      default:
        return '#6b7280'; // gray
    }
  };

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'finish-to-start':
        return 'FS';
      case 'start-to-start':
        return 'SS';
      case 'finish-to-finish':
        return 'FF';
      case 'start-to-finish':
        return 'SF';
      default:
        return '?';
    }
  };

  return (
    <svg className="pointer-events-none absolute inset-0" style={{ zIndex: 1 }}>
      <defs>
        {/* Marqueurs de flèches pour chaque couleur */}
        <marker
          id="arrowhead-blue"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
        </marker>
        <marker
          id="arrowhead-green"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="#10b981" />
        </marker>
        <marker
          id="arrowhead-amber"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="#f59e0b" />
        </marker>
        <marker
          id="arrowhead-violet"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="#8b5cf6" />
        </marker>
      </defs>

      {dependencies.map(dep => {
        const fromPos = taskPositions.get(dep.depends_on_task_id);
        const toPos = taskPositions.get(dep.task_id);

        if (!fromPos || !toPos) return null;

        const path = calculatePath(dep, fromPos, toPos);
        const color = getLineColor(dep.dependency_type);
        const label = getTypeLabel(dep.dependency_type);
        const isHovered = hoveredLine === dep.id;

        // Marqueur selon le type
        const markerMap: Record<string, string> = {
          'finish-to-start': 'url(#arrowhead-blue)',
          'start-to-start': 'url(#arrowhead-green)',
          'finish-to-finish': 'url(#arrowhead-amber)',
          'start-to-finish': 'url(#arrowhead-violet)',
        };

        return (
          <g key={dep.id}>
            {/* Ligne invisible plus large pour faciliter le hover */}
            <path
              d={path}
              fill="none"
              stroke="transparent"
              strokeWidth="12"
              className="pointer-events-auto cursor-pointer"
              onMouseEnter={() => setHoveredLine(dep.id)}
              onMouseLeave={() => setHoveredLine(null)}
            />

            {/* Ligne visible */}
            <path
              d={path}
              fill="none"
              stroke={color}
              strokeWidth={isHovered ? 3 : 2}
              strokeDasharray={isHovered ? '0' : '5,5'}
              markerEnd={markerMap[dep.dependency_type] || markerMap['finish-to-start']}
              className="pointer-events-none transition-all duration-200"
              opacity={isHovered ? 1 : 0.7}
            />

            {/* Label et bouton supprimer au hover */}
            {isHovered && onDeleteDependency && (
              <>
                {/* Label du type */}
                <text
                  x={(fromPos.left + fromPos.width + toPos.left) / 2}
                  y={(fromPos.top + fromPos.height / 2 + toPos.top + toPos.height / 2) / 2 - 10}
                  fill={color}
                  fontSize="12"
                  fontWeight="bold"
                  className="pointer-events-none"
                  textAnchor="middle"
                >
                  {label}
                </text>

                {/* Bouton supprimer */}
                <g
                  className="pointer-events-auto cursor-pointer"
                  onClick={e => {
                    e.stopPropagation();
                    onDeleteDependency(dep.id);
                  }}
                  transform={`translate(${(fromPos.left + fromPos.width + toPos.left) / 2 - 10}, ${
                    (fromPos.top + fromPos.height / 2 + toPos.top + toPos.height / 2) / 2 + 5
                  })`}
                >
                  <circle r="10" fill="white" stroke={color} strokeWidth="2" />
                  <foreignObject x="-8" y="-8" width="16" height="16">
                    <X className="h-4 w-4" style={{ color }} />
                  </foreignObject>
                </g>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
};
