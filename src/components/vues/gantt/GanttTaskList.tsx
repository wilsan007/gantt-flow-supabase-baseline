import { GanttTask } from '@/lib/ganttHelpers';

interface GanttTaskListProps {
  tasks: GanttTask[];
  rowHeight: number;
  displayMode?: 'tasks' | 'projects';
  onTaskIndexMap?: (map: Map<string, number>) => void;
}

export const GanttTaskList = ({ tasks, rowHeight, displayMode = 'tasks' }: GanttTaskListProps) => {
  // Regrouper les tâches par projet si on est en mode tâches
  const groupedTasks =
    displayMode === 'tasks'
      ? tasks.reduce((groups: { [key: string]: GanttTask[] }, task) => {
          const projectName = task.projectName || 'Sans projet';
          if (!groups[projectName]) {
            groups[projectName] = [];
          }
          groups[projectName].push(task);
          return groups;
        }, {})
      : null;

  // Calculer l'index réel de chaque tâche en tenant compte des headers de projet
  const getTaskRealIndex = (taskId: string): number => {
    if (displayMode === 'projects') {
      return tasks.findIndex(t => t.id === taskId);
    }

    let currentIndex = 0;
    if (groupedTasks) {
      for (const [projectName, projectTasks] of Object.entries(groupedTasks)) {
        // +1 pour le header du projet
        currentIndex++;

        const taskIndex = projectTasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
          return currentIndex + taskIndex;
        }

        currentIndex += projectTasks.length;
      }
    }
    return 0;
  };

  return (
    <div className="glass border-gantt-grid/50 bg-gantt-task-bg/30 w-64 border-r backdrop-blur-sm">
      <div className="border-gantt-grid/50 bg-gantt-header flex h-20 items-center border-b px-4">
        <span className="font-medium text-foreground">
          {displayMode === 'projects' ? 'Projets' : 'Tâches'}
        </span>
      </div>

      {displayMode === 'projects'
        ? // Mode projets : affichage simple
          tasks.map(task => (
            <div
              key={task.id}
              className="border-gantt-grid/30 hover:bg-gantt-hover/20 transition-smooth flex cursor-pointer items-center border-b px-4"
              style={{ height: rowHeight }}
            >
              <div>
                <div
                  className="text-lg font-bold text-foreground"
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    color: task.color,
                  }}
                >
                  📁 {task.name}
                </div>
                <div className="text-sm text-foreground/70">
                  <span className="inline-flex items-center gap-1">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: task.color }}
                    ></span>
                    {task.progress}% complété - {task.assignee}
                  </span>
                </div>
              </div>
            </div>
          ))
        : // Mode tâches : regroupement par projet
          groupedTasks &&
          Object.entries(groupedTasks).map(([projectName, projectTasks]) => (
            <div key={projectName}>
              {/* Header du projet */}
              <div className="bg-gantt-header/50 border-gantt-grid/50 border-b px-4 py-2">
                <div
                  className="font-bold text-foreground"
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontSize: '1.1rem',
                    color: projectTasks[0]?.color || '#6b7280',
                  }}
                >
                  📁 {projectName}
                </div>
              </div>

              {/* Tâches du projet */}
              {projectTasks.map(task => (
                <div
                  key={task.id}
                  className="border-gantt-grid/30 hover:bg-gantt-hover/20 transition-smooth flex cursor-pointer items-center border-b px-6"
                  style={{ height: rowHeight }}
                >
                  <div>
                    <div className="font-medium text-foreground">{task.name}</div>
                    <div className="text-sm text-foreground/70">
                      <span className="inline-flex items-center gap-1">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: task.color }}
                        ></span>
                        {task.progress}% complété - {task.assignee}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
    </div>
  );
};
