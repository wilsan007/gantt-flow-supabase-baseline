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
  TableRow 
} from '@/components/ui/table';
import { Plus } from 'lucide-react';
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
  onScroll
}: TaskActionColumnsProps) => {
  const uniqueActions = getUniqueActions(tasks);
  const { currentTenant } = useTenant();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<{ taskId: string; actionId: string; actionTitle: string } | null>(null);
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
                .from('operational_action_attachments')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', currentTenant.id)
                .eq('action_template_id', action.id)
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
        [key]: newCount
      }));
    }
  };

  const handleToggleActionWithValidation = (taskId: string, actionId: string) => {
    const key = `${taskId}-${actionId}`;
    const fileCount = attachmentCounts[key] || 0;
    
    // Vérifier si au moins 1 fichier est uploadé
    if (fileCount === 0) {
      toast.error('Document requis', {
        description: 'Veuillez uploader au moins un document de preuve avant de valider cette action.',
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

  return (
    <div 
      ref={scrollRef}
      className="h-[600px] overflow-auto"
      onScroll={onScroll}
    >
      <Table>
        <TableHeader className="sticky top-0 z-20 bg-gradient-to-r from-cyan-500 to-cyan-600 border-b-2 border-slate-300 shadow-md">
          <TableRow className="h-16 hover:bg-transparent border-0">
            {orderedActions.map((actionTitle) => {
              const isSelectedTaskAction = selectedTaskId && 
                tasks.find(task => task.id === selectedTaskId)?.task_actions?.some(action => action.title === actionTitle);
              
              // IMPORTANT: Tronquer à 40 caractères maximum
              const truncatedTitle = actionTitle.slice(0, 40);
              
              // Diviser le titre en 2 lignes : 0-20 et 21-40
              const line1 = truncatedTitle.slice(0, 20);
              const line2 = truncatedTitle.slice(20, 40);
              
              return (
                <TableHead 
                  key={actionTitle} 
                  className={`min-w-[140px] max-w-[140px] text-center h-16 transition-colors text-white font-bold ${
                    isSelectedTaskAction 
                      ? 'ring-2 ring-yellow-400/50' 
                      : ''
                  }`}
                  title={actionTitle} // Tooltip avec le titre complet
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="text-xs leading-tight">
                      <div className="font-bold">{line1}</div>
                      {line2 && <div className="font-bold">{line2}</div>}
                    </div>
                    {isSelectedTaskAction && (
                      <div className="w-6 h-0.5 bg-yellow-400 rounded-full animate-pulse" />
                    )}
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTasks.map((task) => {
            const isSubtask = (task.task_level || 0) > 0;
            const isSelectedTask = selectedTaskId === task.id;
            
              return (
                <TableRow 
                  key={task.id}
                  className={`border-b transition-colors ${
                    isSelectedTask ? 'bg-primary/10 border-primary/30' : ''
                  }`}
                  style={{ 
                    height: isSubtask ? '51px' : '64px',
                    minHeight: isSubtask ? '51px' : '64px',
                    maxHeight: isSubtask ? '51px' : '64px'
                  }}
                >
                {orderedActions.map((actionTitle) => {
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
                        <div className={`flex items-center justify-center gap-2 ${
                          isSelectedTaskAction ? 'transform scale-110' : ''
                        } transition-transform`}>
                          {/* Cercle avec pourcentage */}
                          <div className="flex flex-col items-center gap-1">
                            <Checkbox
                              checked={action.is_done}
                              disabled={!action.is_done && (attachmentCounts[`${task.id}-${action.id}`] || 0) === 0}
                              onCheckedChange={() => {
                                console.log('Checkbox clicked - Task ID:', task.id, 'Action ID:', action.id);
                                handleToggleActionWithValidation(task.id, action.id);
                              }}
                              className={`${isSubtask ? 'scale-75' : ''} ${
                                isSelectedTaskAction ? 'border-primary data-[state=checked]:bg-primary' : ''
                              } ${(attachmentCounts[`${task.id}-${action.id}`] || 0) === 0 && !action.is_done ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                            <span className={`text-muted-foreground font-medium ${
                              isSubtask ? 'text-xs' : 'text-xs'
                            } ${isSelectedTaskAction ? 'text-primary font-bold' : ''}`}>
                              {action.weight_percentage}%
                            </span>
                          </div>
                          
                          {/* Bouton + avec compteur */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => handleAttachmentClick(task.id, action.id, action.title)}
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 hover:bg-green-500/20"
                                >
                                  <Plus className="h-4 w-4 text-green-600" />
                                  {attachmentCounts[`${task.id}-${action.id}`] > 0 && (
                                    <Badge 
                                      variant="secondary" 
                                      className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[9px] bg-green-600 text-white"
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
          onUploadSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
};