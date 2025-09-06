import { Task } from '@/hooks/useTasks';

export const priorityColors = {
  low: 'bg-success/10 text-success border-success/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  high: 'bg-info/10 text-info border-info/20',
  urgent: 'bg-danger/10 text-danger border-danger/20'
};

export const statusColors = {
  todo: 'bg-muted text-muted-foreground border-border',
  doing: 'bg-tech-blue/10 text-tech-blue border-tech-blue/20',
  blocked: 'bg-danger/10 text-danger border-danger/20',
  done: 'bg-success/10 text-success border-success/20'
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
};

export const getUniqueActions = (tasks: Task[]) => {
  const allActions = new Set<string>();
  tasks.forEach(task => {
    task.task_actions?.forEach(action => {
      allActions.add(action.title);
    });
  });
  return Array.from(allActions);
};