// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus } from '@/lib/icons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ActionAttachmentUpload } from '@/components/operations/ActionAttachmentUpload';
import { type Task } from '@/hooks/optimized';
import { getUniqueActions } from '@/lib/taskHelpers';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

interface TaskActionColumnsProps {
  tasks: Task[];
  onToggleAction: (taskId: string, actionId: string) => void;
  selectedTaskId?: string;
  scrollRef?: React.RefObject<HTMLDivElement>;
  onScroll?: () => void;
}

export const TaskActionColumns = ({
  tasks,
  onToggleAction,
  selectedTaskId,
  scrollRef,
  onScroll,
}: TaskActionColumnsProps) => {
  const uniqueActions = getUniqueActions(tasks);
  const { currentTenant } = useTenant();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<{
    taskId: string;
    actionId: string;
    actionTitle: string;
  } | null>(null);
  const [attachmentCounts, setAttachmentCounts] = useState<Record<string, number>>({});

  // Charger les compteurs de fichiers pour chaque action
  useEffect(() => {
    const loadAttachmentCounts = async () => {
      if (!currentTenant || tasks.length === 0) return;

      const counts: Record<string, number> = {};

      for (const task of tasks) {
        if (task.task_actions) {
          for (const action of task.task_actions) {
            try {
              const { count } = await supabase
                .from('task_action_attachments')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', currentTenant.id)
                .eq('task_action_id', action.id)
                .eq('task_id', task.id);

              if (count !== null) {
                counts[`${task.id}-${action.id}`] = count;
              }
            } catch (err) {
              console.error(`Erreur chargement compteur pour ${action.id}:`, err);
            }
          }
        }
      }

      setAttachmentCounts(counts);
    };

    loadAttachmentCounts();
  }, [tasks, currentTenant]);

  const handleAttachmentClick = (taskId: string, actionId: string, actionTitle: string) => {
    setSelectedAction({ taskId, actionId, actionTitle });
    setUploadDialogOpen(true);
  };

  const handleUploadSuccess = () => {
    if (selectedAction) {
      const key = `${selectedAction.taskId}-${selectedAction.actionId}`;
      const newCount = (attachmentCounts[key] || 0) + 1;
      setAttachmentCounts(prev => ({
        ...prev,
        [key]: newCount,
      }));
    }
  };

  const handleToggleActionWithValidation = (taskId: string, actionId: string) => {
    const key = `${taskId}-${actionId}`;
    const fileCount = attachmentCounts[key] || 0;

    // Vérifier si au moins 1 fichier est uploadé
    if (fileCount === 0) {
      toast.error('Document requis', {
        description:
          'Veuillez uploader au moins un document de preuve avant de valider cette action.',
        duration: 4000,
      });
      return;
    }

    // Si OK, appeler la fonction de validation normale
    onToggleAction(taskId, actionId);
  };

  // Réorganiser les colonnes d'actions selon la tâche sélectionnée
  const reorderActionsForSelectedTask = (actions: string[], selectedTaskId?: string): string[] => {
    if (!selectedTaskId) return actions;

    const selectedTask = tasks.find(task => task.id === selectedTaskId);
    if (!selectedTask || !selectedTask.task_actions) return actions;

    // Actions de la tâche sélectionnée en premier
    const selectedTaskActions = selectedTask.task_actions.map(action => action.title);
    const otherActions = actions.filter(action => !selectedTaskActions.includes(action));

    return [...selectedTaskActions, ...otherActions];
  };

  const orderedActions = reorderActionsForSelectedTask(uniqueActions, selectedTaskId);

  // Trier les tâches par display_order pour être aligné avec TaskFixedColumns
  const sortedTasks = [...tasks].sort((a, b) => {
    const orderA = a.display_order?.split('.').map(n => parseInt(n)) || [0];
    const orderB = b.display_order?.split('.').map(n => parseInt(n)) || [0];

    for (let i = 0; i < Math.max(orderA.length, orderB.length); i++) {
      const numA = orderA[i] || 0;
      const numB = orderB[i] || 0;
      if (numA !== numB) return numA - numB;
    }
    return 0;
  });

  // Générer les lignes fantômes (identique à TaskTableBody)
  const ghostTasks: Task[] = Array.from({ length: 5 }).map(
    (_, index) =>
      ({
        id: `ghost-task-${index}`,
        title: '',
        status: 'todo',
        priority: 'medium',
        assignee: '',
        project_id: '',
        start_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        effort_estimate_h: 0,
        progress: 0,
        tags: [],
        subtasks: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_ghost: true,
      }) as any
  );

  const allTasks = [...sortedTasks, ...ghostTasks];

  // Si aucune action, afficher un message
  if (orderedActions.length === 0) {
    return (
      <div
        ref={scrollRef}
        className="bg-muted/20 flex h-[600px] items-center justify-center overflow-auto"
        onScroll={onScroll}
      >
        <div className="p-8 text-center">
          <p className="text-muted-foreground mb-2 font-medium">Aucune colonne d'action</p>
          <p className="text-muted-foreground text-sm">
            Sélectionnez une tâche et ajoutez une colonne d'action via le header
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="h-[600px] overflow-auto" onScroll={onScroll}>
      <Table>
        <TableHeader className="sticky top-0 z-20 border-b-2 border-slate-300 bg-gradient-to-r from-cyan-500 to-cyan-600 shadow-md">
          <TableRow className="h-16 border-0 hover:bg-transparent">
            {orderedActions.map(actionTitle => {
              const isSelectedTaskAction =
                selectedTaskId &&
                tasks
                  .find(task => task.id === selectedTaskId)
                  ?.task_actions?.some(action => action.title === actionTitle);

              return (
                <TableHead
                  key={actionTitle}
                  className={`h-16 max-w-[140px] min-w-[140px] text-center font-bold text-white transition-colors ${
                    isSelectedTaskAction ? 'ring-2 ring-yellow-400/50' : ''
                  }`}
                  title={actionTitle} // Tooltip avec le titre complet
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <div
                      className="px-1 text-xs leading-tight font-bold"
                      style={{
                        wordBreak: 'normal',
                        overflowWrap: 'break-word',
                        hyphens: 'auto',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {actionTitle}
                    </div>
                    {isSelectedTaskAction && (
                      <div className="h-0.5 w-6 animate-pulse rounded-full bg-yellow-400" />
                    )}
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {allTasks.map(task => {
            const isSubtask = (task.task_level || 0) > 0;
            const isSelectedTask = selectedTaskId === task.id;
            const isGhost = task.id.startsWith('ghost-task-');

            return (
              <TableRow
                key={task.id}
                className={`border-b transition-colors ${
                  isSelectedTask ? 'border-primary/30 bg-primary/10' : ''
                } ${isGhost ? 'border-dashed opacity-60' : ''}`}
                style={{
                  height: isSubtask ? '51px' : '64px',
                  minHeight: isSubtask ? '51px' : '64px',
                  maxHeight: isSubtask ? '51px' : '64px',
                }}
              >
                {orderedActions.map(actionTitle => {
                  const action = task.task_actions?.find(a => a.title === actionTitle);
                  const isSelectedTaskAction = isSelectedTask && action;

                  return (
                    <TableCell
                      key={actionTitle}
                      className={`text-center transition-colors ${
                        isSubtask ? 'py-0 text-xs' : 'py-0'
                      } ${isSelectedTaskAction ? 'bg-primary/5' : ''}`}
                      style={{ height: isSubtask ? '51px' : '64px' }}
                    >
                      {action ? (
                        <div
                          className={`flex items-center justify-center gap-2 ${
                            isSelectedTaskAction ? 'scale-110 transform' : ''
                          } transition-transform`}
                        >
                          {/* Cercle avec pourcentage */}
                          <div className="flex flex-col items-center gap-1">
                            <Checkbox
                              checked={action.is_done}
                              disabled={
                                !action.is_done &&
                                (attachmentCounts[`${task.id}-${action.id}`] || 0) === 0
                              }
                              onCheckedChange={() => {
                                console.log(
                                  'Checkbox clicked - Task ID:',
                                  task.id,
                                  'Action ID:',
                                  action.id
                                );
                                handleToggleActionWithValidation(task.id, action.id);
                              }}
                              className={`${isSubtask ? 'scale-75' : ''} ${
                                isSelectedTaskAction
                                  ? 'border-primary data-[state=checked]:bg-primary'
                                  : ''
                              } ${(attachmentCounts[`${task.id}-${action.id}`] || 0) === 0 && !action.is_done ? 'cursor-not-allowed opacity-50' : ''}`}
                            />
                            <span
                              className={`text-muted-foreground font-medium ${
                                isSubtask ? 'text-xs' : 'text-xs'
                              } ${isSelectedTaskAction ? 'text-primary font-bold' : ''}`}
                            >
                              {action.weight_percentage}%
                            </span>
                          </div>

                          {/* Bouton + avec compteur */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() =>
                                    handleAttachmentClick(task.id, action.id, action.title)
                                  }
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 hover:bg-green-500/20"
                                >
                                  <Plus className="h-4 w-4 text-green-600" />
                                  {attachmentCounts[`${task.id}-${action.id}`] > 0 && (
                                    <Badge
                                      variant="secondary"
                                      className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center bg-green-600 p-0 text-[9px] text-white"
                                    >
                                      {attachmentCounts[`${task.id}-${action.id}`]}
                                    </Badge>
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">
                                  {attachmentCounts[`${task.id}-${action.id}`] > 0
                                    ? `${attachmentCounts[`${task.id}-${action.id}`]} fichier(s) • Cliquez pour ajouter`
                                    : 'Ajouter un document de preuve (requis)'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Dialog Upload Fichiers */}
      {selectedAction && (
        <ActionAttachmentUpload
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          actionTemplateId={selectedAction.actionId}
          actionTitle={selectedAction.actionTitle}
          taskId={selectedAction.taskId}
          actionType="task_action"
          onUploadSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
};
