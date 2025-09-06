import { GanttTask } from '@/lib/ganttHelpers';

interface GanttTaskListProps {
  tasks: GanttTask[];
  rowHeight: number;
}

export const GanttTaskList = ({ tasks, rowHeight }: GanttTaskListProps) => (
  <div className="w-64 bg-muted/30 border-r border-border">
    <div className="h-20 flex items-center px-4 border-b border-border">
      <span className="font-medium text-foreground">Tâches</span>
    </div>
    {tasks.map((task) => (
      <div
        key={task.id}
        className="flex items-center px-4 border-b border-border hover:bg-muted/50 transition-colors"
        style={{ height: rowHeight }}
      >
        <div>
          <div className="font-medium text-foreground">{task.name}</div>
          <div className="text-sm text-muted-foreground">
            {task.progress}% complété - {task.assignee}
          </div>
        </div>
      </div>
    ))}
  </div>
);