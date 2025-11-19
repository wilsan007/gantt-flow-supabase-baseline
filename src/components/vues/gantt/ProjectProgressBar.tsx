import React from 'react';
import { Progress } from '@/components/ui/progress';

interface ProjectProgressBarProps {
  projectNumber: number | null;
  projectName: string;
  projectColor: string;
  projectProgress: number;
  projectDuration: number;
  taskCount: number;
}

export const ProjectProgressBar: React.FC<ProjectProgressBarProps> = ({
  projectNumber,
  projectName,
  projectColor,
  projectProgress,
  projectDuration,
  taskCount,
}) => {
  return (
    <div className="flex h-full w-full flex-col justify-center gap-1.5 overflow-hidden px-4 py-1.5">
      {/* Ligne 1: Nom complet du projet + Nombre de tâches */}
      <div className="flex w-full items-center gap-2">
        {/* Numéro du projet */}
        {projectNumber && (
          <span className="flex-shrink-0 rounded bg-white/20 px-2 py-0.5 text-xs font-bold text-white">
            #{projectNumber}
          </span>
        )}

        {/* Nom complet du projet - SANS troncature */}
        <span className="flex items-center gap-1.5 font-bold text-white">
          <span className="flex-shrink-0">📁</span>
          <span className="text-sm">{projectName}</span>
        </span>

        {/* Badge nombre de tâches uniquement */}
        <span className="ml-auto flex-shrink-0 rounded-full bg-white/30 px-2.5 py-0.5 text-xs font-semibold text-white">
          {taskCount} tâche{taskCount > 1 ? 's' : ''}
        </span>
      </div>

      {/* Ligne 2: Barre de progression avec pourcentage intégré */}
      <div className="relative h-3 w-full overflow-hidden rounded-full border border-white/40 bg-white/20 shadow-inner">
        <div
          className="h-full rounded-full bg-gradient-to-r from-white/90 to-white/70 shadow-sm transition-all duration-500"
          style={{ width: `${projectProgress}%` }}
        />
        {/* Indicateur de progression animé */}
        {projectProgress > 0 && projectProgress < 100 && (
          <div
            className="absolute top-0 h-full w-6 animate-pulse bg-gradient-to-r from-transparent via-white/50 to-transparent"
            style={{ left: `${Math.max(0, projectProgress - 8)}%` }}
          />
        )}
        {/* Pourcentage centré dans la barre */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-extrabold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {projectProgress}%
          </span>
        </div>
      </div>
    </div>
  );
};
