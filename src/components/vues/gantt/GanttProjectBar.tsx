import React from 'react';
import { ViewConfig } from '@/lib/ganttHelpers';
import { getUnitPosition } from '@/lib/ganttHelpers';

interface GanttProjectBarProps {
  projectStart: Date;
  projectEnd: Date;
  progress: number;
  color: string;
  projectName: string;
  index: number;
  rowHeight: number;
  startDate: Date;
  config: ViewConfig;
  verticalPosition?: number; // Position verticale cumulative calculée
}

export const GanttProjectBar: React.FC<GanttProjectBarProps> = ({
  projectStart,
  projectEnd,
  progress,
  color,
  projectName,
  index,
  rowHeight,
  startDate,
  config,
  verticalPosition,
}) => {
  // Calculer position
  const left = getUnitPosition(projectStart, startDate, config);

  // Calculer largeur basée sur la durée
  const durationDays = Math.ceil(
    (projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  const width = (durationDays / config.unitDuration) * config.unitWidth;

  // Utiliser verticalPosition si fourni (alignement parfait)
  const topPosition = verticalPosition !== undefined ? verticalPosition + 8 : index * rowHeight + 8;

  return (
    <div
      className="absolute"
      style={{
        top: topPosition,
        left: left,
        width: width,
        height: rowHeight - 16,
        cursor: 'not-allowed', // Curseur indiquant que ce n'est pas déplaçable
        pointerEvents: 'auto', // Permet le hover pour le tooltip
      }}
      onMouseDown={e => {
        // ✅ BLOQUER complètement les événements de drag sur les barres de projet
        e.preventDefault();
        e.stopPropagation();
        console.warn(
          '❌ Les barres de projet ne peuvent pas être déplacées. Seules les tâches peuvent être déplacées.'
        );
      }}
    >
      {/* Barre de projet - Design premium distinct des tâches - NON DÉPLAÇABLE */}
      <div
        className="group relative h-full overflow-hidden rounded-xl border-4 shadow-2xl transition-all duration-300"
        style={{
          borderColor: color,
          background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
        }}
      >
        {/* Bordure intérieure décorative */}
        <div
          className="absolute inset-1 rounded-lg border-2 border-white/20"
          style={{ borderColor: `${color}40` }}
        />

        {/* Partie complétée - gradient diagonal */}
        <div
          className="absolute inset-0 rounded-lg transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(135deg, ${color}90 0%, ${color}60 100%)`,
          }}
        >
          {/* Effet brillant animé */}
          {progress > 0 && (
            <div className="absolute inset-0 overflow-hidden rounded-lg">
              <div
                className="absolute inset-y-0 w-12 animate-pulse bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{
                  left: `${Math.max(0, progress - 20)}%`,
                  animationDuration: '2s',
                }}
              />
            </div>
          )}
        </div>

        {/* Icône et texte centré - avec overflow contrôlé */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden px-2">
          <div className="flex items-center gap-1.5">
            {/* Icône projet */}
            <span className="flex-shrink-0 text-xl drop-shadow-lg">📁</span>

            {/* Pourcentage principal */}
            <span
              className="flex-shrink-0 text-2xl font-black drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
              style={{ color }}
            >
              {progress}%
            </span>

            {/* Badge durée - seulement si assez d'espace */}
            {width > 200 && (
              <span
                className="ml-1 flex-shrink-0 rounded-full border-2 px-2 py-0.5 text-xs font-bold shadow-lg"
                style={{
                  borderColor: color,
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  color: color,
                }}
              >
                ⏱ {durationDays}j
              </span>
            )}
          </div>
        </div>

        {/* Indicateur visuel de progression (marques) */}
        <div className="absolute right-0 bottom-0 left-0 flex h-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 border-r border-white/20"
              style={{
                backgroundColor: i * 10 <= progress ? `${color}80` : 'transparent',
              }}
            />
          ))}
        </div>

        {/* Info-bulle au survol */}
        <div
          className="pointer-events-none absolute -top-12 left-1/2 z-50 hidden -translate-x-1/2 rounded-lg border-2 bg-white px-4 py-2 shadow-xl group-hover:block"
          style={{ borderColor: color }}
        >
          <div className="text-center">
            <div className="text-sm font-bold" style={{ color }}>
              {projectName}
            </div>
            <div className="text-xs text-gray-600">
              {projectStart.toLocaleDateString('fr-FR')} → {projectEnd.toLocaleDateString('fr-FR')}
            </div>
            <div className="text-xs font-semibold" style={{ color }}>
              Progression: {progress}% | Durée: {durationDays} jours
            </div>
          </div>
          {/* Flèche */}
          <div
            className="absolute top-full left-1/2 h-0 w-0 -translate-x-1/2 border-8 border-transparent"
            style={{ borderTopColor: color }}
          />
        </div>
      </div>
    </div>
  );
};
