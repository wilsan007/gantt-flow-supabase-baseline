export type ViewMode = 'day' | 'week' | 'month';

export interface GanttTask {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  color: string;
  assignee: string;
  priority: string;
  status: string;
  projectName?: string; // Nom du projet pour le regroupement et les couleurs
}

export interface ViewConfig {
  unitWidth: number;
  headerHeight: number;
  getUnit: (date: Date) => string;
  getSubUnit: (date: Date) => string;
  unitDuration: number;
}

export const statusColors = {
  todo: 'muted-foreground',
  doing: 'tech-blue',
  blocked: 'tech-red', 
  done: 'success'
};

export const getViewConfig = (viewMode: ViewMode): ViewConfig => {
  switch (viewMode) {
    case 'day':
      return { 
        unitWidth: 40, 
        headerHeight: 80,
        getUnit: (date: Date) => date.getDate().toString(),
        getSubUnit: (date: Date) => date.toLocaleDateString('fr-FR', { month: 'short' }),
        unitDuration: 1
      };
    case 'week':
      return { 
        unitWidth: 120, 
        headerHeight: 80,
        getUnit: (date: Date) => `S${Math.ceil(date.getDate() / 7)}`,
        getSubUnit: (date: Date) => date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        unitDuration: 7
      };
    case 'month':
      return { 
        unitWidth: 200, 
        headerHeight: 80,
        getUnit: (date: Date) => date.toLocaleDateString('fr-FR', { month: 'short' }),
        getSubUnit: (date: Date) => date.getFullYear().toString(),
        unitDuration: 30
      };
    default:
      return { unitWidth: 40, headerHeight: 80, getUnit: () => '', getSubUnit: () => '', unitDuration: 1 };
  }
};

export const getUnitPosition = (date: Date, startDate: Date, config: ViewConfig) => {
  const days = Math.ceil((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const units = days / config.unitDuration;
  return units * config.unitWidth;
};

export const getTaskWidth = (task: GanttTask, config: ViewConfig) => {
  const duration = Math.ceil((task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24));
  return (duration / config.unitDuration) * config.unitWidth;
};

export const getTotalUnits = (startDate: Date, endDate: Date, config: ViewConfig) => {
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.ceil(totalDays / config.unitDuration);
};