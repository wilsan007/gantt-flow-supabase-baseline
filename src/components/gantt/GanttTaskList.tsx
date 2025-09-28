import { GanttTask } from '@/lib/ganttHelpers';

interface GanttTaskListProps {
  tasks: GanttTask[];
  rowHeight: number;
  displayMode?: 'tasks' | 'projects';
}

export const GanttTaskList = ({ tasks, rowHeight, displayMode = 'tasks' }: GanttTaskListProps) => {
  // Regrouper les tâches par projet si on est en mode tâches
  const groupedTasks = displayMode === 'tasks' ? 
    tasks.reduce((groups: { [key: string]: GanttTask[] }, task) => {
      const projectName = task.projectName || 'Sans projet';
      if (!groups[projectName]) {
        groups[projectName] = [];
      }
      groups[projectName].push(task);
      return groups;
    }, {}) : null;

  return (
    <div className="w-64 glass border-r border-gantt-grid/50 bg-gantt-task-bg/30 backdrop-blur-sm">
      <div className="h-20 flex items-center px-4 border-b border-gantt-grid/50 bg-gantt-header">
        <span className="font-medium text-foreground">
          {displayMode === 'projects' ? 'Projets' : 'Tâches'}
        </span>
      </div>
      
      {displayMode === 'projects' ? (
        // Mode projets : affichage simple
        tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center px-4 border-b border-gantt-grid/30 hover:bg-gantt-hover/20 transition-smooth cursor-pointer"
            style={{ height: rowHeight }}
          >
            <div>
              <div className="font-bold text-lg text-foreground" style={{ 
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: task.color 
              }}>
                📁 {task.name}
              </div>
              <div className="text-sm text-foreground/70">
                <span className="inline-flex items-center gap-1">
                  <span 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: task.color }}
                  ></span>
                  {task.progress}% complété - {task.assignee}
                </span>
              </div>
            </div>
          </div>
        ))
      ) : (
        // Mode tâches : regroupement par projet
        groupedTasks && Object.entries(groupedTasks).map(([projectName, projectTasks]) => (
          <div key={projectName}>
            {/* Header du projet */}
            <div className="px-4 py-2 bg-gantt-header/50 border-b border-gantt-grid/50">
              <div className="font-bold text-foreground" style={{ 
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '1.1rem',
                color: projectTasks[0]?.color || '#6b7280'
              }}>
                📁 {projectName}
              </div>
            </div>
            
            {/* Tâches du projet */}
            {projectTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center px-6 border-b border-gantt-grid/30 hover:bg-gantt-hover/20 transition-smooth cursor-pointer"
                style={{ height: rowHeight }}
              >
                <div>
                  <div className="font-medium text-foreground">{task.name}</div>
                  <div className="text-sm text-foreground/70">
                    <span className="inline-flex items-center gap-1">
                      <span 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: task.color }}
                      ></span>
                      {task.progress}% complété - {task.assignee}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
};