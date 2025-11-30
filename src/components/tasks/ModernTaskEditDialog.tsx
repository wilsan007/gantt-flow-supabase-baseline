import React, { useState, useEffect } from 'react';
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
} from '@/components/ui/responsive-modal';
import { Separator } from '@/components/ui/separator';
import { type Task } from '@/hooks/optimized';
import { useEmployees } from '@/hooks/useEmployees';
import {
  TaskTitleSection,
  TaskProperties,
  TaskDescription,
  TaskActionsSubtasks,
  TaskEditFooter,
} from './edit';

interface TaskAction {
  id: string;
  name: string;
  description?: string;
  status?: string;
  progress?: number;
}

interface ModernTaskEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onSave: (taskData: any) => void;
}

export const ModernTaskEditDialog: React.FC<ModernTaskEditDialogProps> = ({
  open,
  onOpenChange,
  task,
  onSave,
}) => {
  // États de base
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'todo' | 'doing' | 'blocked' | 'done'>('todo');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [assignee, setAssignee] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [effortEstimate, setEffortEstimate] = useState<number>(0);
  const [department, setDepartment] = useState('');
  const [project, setProject] = useState('');
  const [actions, setActions] = useState<TaskAction[]>([]);
  const [showActions, setShowActions] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [loading, setLoading] = useState(false);

  // Hooks pour les données
  const { employees, departments } = useEmployees();

  // Mock projects data (useEmployees doesn't provide projects)
  const projects = [
    { id: '1', name: 'Gantt Flow Next' },
    { id: '2', name: 'Projet Alpha' },
    { id: '3', name: 'Projet Beta' },
  ];

  const statusIcons = {
    todo: '📝',
    doing: '⚡',
    blocked: '🚫',
    done: '✅',
  };

  const priorityIcons = {
    low: '🟢',
    medium: '🟡',
    high: '🟠',
    urgent: '🔴',
  };

  // Initialiser les champs quand la tâche change
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus((task.status as any) || 'todo');
      setStartDate(task.start_date ? new Date(task.start_date) : undefined);
      setDueDate(task.due_date ? new Date(task.due_date) : undefined);
      setAssignee(task.assignee_id || '');
      setPriority((task.priority as any) || 'medium');
      setEffortEstimate(task.effort_estimate_h || 0);
      setDepartment(task.department_id || '');
      setProject(task.project_id || '');
      setActions((task as any).actions || []);
    }
  }, [task]);

  const handleSave = async () => {
    if (!title.trim() || !assignee) return;

    try {
      setLoading(true);
      await onSave({
        ...task,
        title,
        description,
        status,
        start_date: startDate?.toISOString(),
        due_date: dueDate?.toISOString(),
        assignee_id: assignee,
        priority,
        effort_estimate_h: effortEstimate,
        department_id: department || null,
        project_id: project || null,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la modification de la tâche');
    } finally {
      setLoading(false);
    }
  };

  if (!task) return null;

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent>
        <ResponsiveModalHeader className="sr-only">
          <ResponsiveModalTitle>Modifier la tâche</ResponsiveModalTitle>
          <ResponsiveModalDescription>
            Modifier les détails de la tâche {task.title}
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        {/* Content area - let DrawerContent handle scrolling on mobile */}
        <div className="space-y-4 px-6 py-6">
          {/* Titre */}
          <TaskTitleSection title={title} onTitleChange={setTitle} hasParent={!!task.parent_id} />

          {/* Propriétés principales */}
          <TaskProperties
            status={status}
            onStatusChange={(value: any) => setStatus(value)}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={dueDate}
            onEndDateChange={setDueDate}
            effortEstimate={effortEstimate}
            onEffortChange={setEffortEstimate}
            assignee={assignee}
            onAssigneeChange={setAssignee}
            priority={priority}
            onPriorityChange={(value: any) => setPriority(value)}
            department={department}
            onDepartmentChange={setDepartment}
            project={project}
            onProjectChange={setProject}
            employees={employees}
            departments={departments}
            projects={projects}
            statusIcons={statusIcons}
            priorityIcons={priorityIcons}
          />

          <Separator />

          {/* Description */}
          <TaskDescription description={description} onDescriptionChange={setDescription} />

          {/* Actions et sous-tâches */}
          <TaskActionsSubtasks
            actions={actions}
            onActionsChange={setActions}
            showActions={showActions}
            onToggleActions={() => setShowActions(!showActions)}
            showSubtasks={showSubtasks}
            onToggleSubtasks={() => setShowSubtasks(!showSubtasks)}
          />
        </div>

        {/* Footer with buttons - Fixed at bottom on desktop, scrolls with content on mobile */}
        <TaskEditFooter
          onCancel={() => onOpenChange(false)}
          onSave={handleSave}
          loading={loading}
          canSave={!!title.trim() && !!assignee}
        />
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};
