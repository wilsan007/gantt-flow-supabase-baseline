import { GanttTask } from '@/lib/ganttHelpers';

interface GanttTaskListProps {
  tasks: GanttTask[];
  rowHeight: number;
}

export const GanttTaskList = ({ tasks, rowHeight }: GanttTaskListProps) => (
  <div className="w-64 glass border-r border-border/50">
    <div className="h-20 flex items-center px-4 border-b border-border/50 bg-gantt-header">
      <span className="font-medium text-foreground">Tâches</span>
    </div>
    {tasks.map((task) => (
      <div
        key={task.id}
        className="flex items-center px-4 border-b border-border/30 hover:bg-primary/10 transition-smooth cursor-pointer"
        style={{ height: rowHeight }}
      >
        <div>
          <div className="font-medium text-foreground">{task.name}</div>
          <div className="text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              {task.progress}% complété - {task.assignee}
            </span>
          </div>
        </div>
      </div>
    ))}
  </div>
);