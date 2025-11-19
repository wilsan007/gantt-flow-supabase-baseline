import React from 'react';
import { GanttTask, ViewConfig, getTotalUnits } from '@/lib/ganttHelpers';
import { GanttTaskBar } from './GanttTaskBar';
import { GanttProjectBar } from './GanttProjectBar';

interface ProjectData {
  projectId: string;
  projectName: string;
  projectColor: string;
  projectProgress: number;
  projectDuration: number;
  projectStart: Date;
  projectEnd: Date;
}

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
  projectsOrder?: Array<{ id: string }>;
  projectsData?: ProjectData[];
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
  projectsOrder = [],
  projectsData = [],
}: GanttTimelineProps) => {
  const totalUnits = getTotalUnits(startDate, endDate, config);

  // Calculer la position verticale cumulative d'une tâche (pour alignement parfait)
  const getTaskVerticalPosition = (taskId: string): number => {
    if (displayMode === 'projects') {
      const index = tasks.findIndex(t => t.id === taskId);
      return index * rowHeight;
    }

    // Regrouper par project_id
    const groupedTasks = tasks.reduce((groups: { [key: string]: GanttTask[] }, task) => {
      const projectKey = task.project_id || 'no-project';
      if (!groups[projectKey]) {
        groups[projectKey] = [];
      }
      groups[projectKey].push(task);
      return groups;
    }, {});

    // Fonction helper pour organiser hiérarchiquement
    const organizeHierarchically = (tasksList: GanttTask[]): GanttTask[] => {
      const parentTasks = tasksList.filter(t => !t.parent_id);
      const childTasks = tasksList.filter(t => t.parent_id);

      const orderedTasks: GanttTask[] = [];
      parentTasks.forEach(parent => {
        orderedTasks.push(parent);
        const children = childTasks.filter(child => child.parent_id === parent.id);
        orderedTasks.push(...children);
      });

      return orderedTasks;
    };

    let cumulativeHeight = 0;

    // Parcourir les projets dans l'ordre
    for (const project of projectsOrder) {
      if (groupedTasks[project.id]) {
        // Ajouter la hauteur du header de projet
        cumulativeHeight += rowHeight;

        // Organiser les tâches hiérarchiquement
        const orderedProjectTasks = organizeHierarchically(groupedTasks[project.id]);

        // Chercher la tâche et calculer sa position
        for (const task of orderedProjectTasks) {
          if (task.id === taskId) {
            return cumulativeHeight;
          }
          // Ajouter la hauteur de cette ligne (85% pour sous-tâches, 100% pour parentes)
          const taskHeight = task.parent_id ? rowHeight * 0.7 : rowHeight;
          cumulativeHeight += taskHeight;
        }
      }
    }

    // Tâches sans projet
    if (groupedTasks['no-project']) {
      cumulativeHeight += rowHeight; // Header "Sans projet"

      const orderedNoProjectTasks = organizeHierarchically(groupedTasks['no-project']);

      for (const task of orderedNoProjectTasks) {
        if (task.id === taskId) {
          return cumulativeHeight;
        }
        const taskHeight = task.parent_id ? rowHeight * 0.7 : rowHeight;
        cumulativeHeight += taskHeight;
      }
    }

    return 0;
  };

  // Calculer l'index réel de chaque tâche en tenant compte des headers de projet ET de la hiérarchie parent-enfant
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

    // Fonction helper pour organiser hiérarchiquement les tâches
    const organizeHierarchically = (tasksList: GanttTask[]): GanttTask[] => {
      const parentTasks = tasksList.filter(t => !t.parent_id);
      const childTasks = tasksList.filter(t => t.parent_id);

      const orderedTasks: GanttTask[] = [];
      parentTasks.forEach(parent => {
        orderedTasks.push(parent);
        // Ajouter les sous-tâches de ce parent juste après
        const children = childTasks.filter(child => child.parent_id === parent.id);
        orderedTasks.push(...children);
      });

      return orderedTasks;
    };

    // Utiliser l'ordre des projets fourni pour garantir l'alignement
    let currentIndex = 0;

    // D'abord parcourir les projets dans l'ordre fourni
    for (const project of projectsOrder) {
      if (groupedTasks[project.id]) {
        // +1 pour le header du projet
        currentIndex++;

        // Organiser les tâches hiérarchiquement
        const orderedProjectTasks = organizeHierarchically(groupedTasks[project.id]);
        const taskIndex = orderedProjectTasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
          return currentIndex + taskIndex;
        }

        currentIndex += orderedProjectTasks.length;
      }
    }

    // Puis les tâches sans projet à la fin
    if (groupedTasks['no-project']) {
      currentIndex++; // Header "Sans projet"

      const orderedNoProjectTasks = organizeHierarchically(groupedTasks['no-project']);
      const taskIndex = orderedNoProjectTasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        return currentIndex + taskIndex;
      }
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

  // Calculer la hauteur totale en tenant compte des headers de projet ET de la hauteur réduite des sous-tâches
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

    let totalHeight = 0;
    const projectCount = Object.keys(groupedTasks).length;

    // Ajouter la hauteur des headers de projet
    totalHeight += projectCount * rowHeight;

    // Ajouter la hauteur des tâches (sous-tâches = 85% de la hauteur)
    tasks.forEach(task => {
      const isSubtask = !!task.parent_id;
      totalHeight += isSubtask ? rowHeight * 0.7 : rowHeight;
    });

    return totalHeight;
  };

  // Générer les positions des lignes horizontales en fonction des hauteurs réelles
  const getHorizontalLinePositions = (): number[] => {
    if (displayMode === 'projects') {
      // Mode projets : lignes régulières
      return Array.from({ length: tasks.length + 1 }, (_, i) => i * rowHeight);
    }

    const positions: number[] = [0];
    const groupedTasks = tasks.reduce((groups: { [key: string]: GanttTask[] }, task) => {
      const projectKey = task.project_id || 'no-project';
      if (!groups[projectKey]) groups[projectKey] = [];
      groups[projectKey].push(task);
      return groups;
    }, {});

    const organizeHierarchically = (tasksList: GanttTask[]): GanttTask[] => {
      const parentTasks = tasksList.filter(t => !t.parent_id);
      const childTasks = tasksList.filter(t => t.parent_id);
      const orderedTasks: GanttTask[] = [];
      parentTasks.forEach(parent => {
        orderedTasks.push(parent);
        orderedTasks.push(...childTasks.filter(child => child.parent_id === parent.id));
      });
      return orderedTasks;
    };

    let cumulativeHeight = 0;

    // Projets et leurs tâches
    for (const project of projectsOrder) {
      if (groupedTasks[project.id]) {
        cumulativeHeight += rowHeight; // Header projet
        positions.push(cumulativeHeight);

        const orderedTasks = organizeHierarchically(groupedTasks[project.id]);
        orderedTasks.forEach(task => {
          const taskHeight = task.parent_id ? rowHeight * 0.7 : rowHeight;
          cumulativeHeight += taskHeight;
          positions.push(cumulativeHeight);
        });
      }
    }

    // Tâches sans projet
    if (groupedTasks['no-project']) {
      cumulativeHeight += rowHeight; // Header "Sans projet"
      positions.push(cumulativeHeight);

      const orderedTasks = organizeHierarchically(groupedTasks['no-project']);
      orderedTasks.forEach(task => {
        const taskHeight = task.parent_id ? rowHeight * 0.7 : rowHeight;
        cumulativeHeight += taskHeight;
        positions.push(cumulativeHeight);
      });
    }

    return positions;
  };

  const horizontalLinePositions = getHorizontalLinePositions();

  return (
    <div className="h-full w-full">
      <div
        className="gantt-chart bg-gantt-task-bg/60 relative backdrop-blur-sm"
        style={{
          minWidth: totalUnits * config.unitWidth,
          height: getTotalHeight(),
        }}
      >
        {/* Lignes horizontales - adaptées aux hauteurs réelles des tâches */}
        {horizontalLinePositions.map((top, index) => (
          <div
            key={index}
            className="border-gantt-grid/60 absolute w-full border-b"
            style={{ top }}
          />
        ))}

        {Array.from({ length: totalUnits }).map((_, index) => (
          <div
            key={index}
            className="border-gantt-grid/60 absolute h-full border-r"
            style={{ left: (index + 1) * config.unitWidth }}
          />
        ))}

        {/* Barres de projets - Design distinctif */}
        {displayMode === 'tasks' &&
          projectsData.map((project, index) => {
            // Calculer la position verticale cumulative du header de projet
            const groupedTasks = tasks.reduce((groups: { [key: string]: GanttTask[] }, task) => {
              const projectKey = task.project_id || 'no-project';
              if (!groups[projectKey]) groups[projectKey] = [];
              groups[projectKey].push(task);
              return groups;
            }, {});

            const organizeHierarchically = (tasksList: GanttTask[]): GanttTask[] => {
              const parentTasks = tasksList.filter(t => !t.parent_id);
              const childTasks = tasksList.filter(t => t.parent_id);
              const orderedTasks: GanttTask[] = [];
              parentTasks.forEach(parent => {
                orderedTasks.push(parent);
                orderedTasks.push(...childTasks.filter(child => child.parent_id === parent.id));
              });
              return orderedTasks;
            };

            let cumulativeHeight = 0;

            // Parcourir les projets précédents pour calculer la position
            for (let i = 0; i < index; i++) {
              const prevProject = projectsData[i];
              if (groupedTasks[prevProject.projectId]) {
                cumulativeHeight += rowHeight; // Header du projet précédent

                const orderedTasks = organizeHierarchically(groupedTasks[prevProject.projectId]);
                orderedTasks.forEach(task => {
                  const taskHeight = task.parent_id ? rowHeight * 0.7 : rowHeight;
                  cumulativeHeight += taskHeight;
                });
              }
            }

            return (
              <GanttProjectBar
                key={`project-${project.projectId}`}
                projectStart={project.projectStart}
                projectEnd={project.projectEnd}
                progress={project.projectProgress}
                color={project.projectColor}
                projectName={project.projectName}
                index={index}
                rowHeight={rowHeight}
                startDate={startDate}
                config={config}
                verticalPosition={cumulativeHeight}
              />
            );
          })}

        {/* Barres de tâches - Design standard avec hauteur ajustée pour sous-tâches */}
        {tasks.map(task => {
          const isSubtask = !!task.parent_id;
          const taskRowHeight = isSubtask ? rowHeight * 0.7 : rowHeight;
          const verticalPos = getTaskVerticalPosition(task.id);

          return (
            <GanttTaskBar
              key={task.id}
              task={task}
              index={getTaskRealIndex(task.id)}
              rowHeight={taskRowHeight}
              startDate={startDate}
              config={config}
              isDragging={draggedTask === task.id}
              isResizing={resizeTask?.taskId === task.id}
              onMouseDown={onTaskMouseDown}
              isSubtask={isSubtask}
              verticalPosition={verticalPos}
            />
          );
        })}
      </div>
    </div>
  );
};
