import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { withUniversalDialog } from '@/components/ui/universal-dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Calendar,
  Clock,
  Users,
  Building2,
  FolderOpen,
  AlertTriangle,
  CheckSquare,
  MessageCircle,
  Target,
  Euro,
  TrendingUp,
  Link,
  History,
} from '@/lib/icons';
import { type Task } from '@/hooks/optimized';
import { TaskHistorySection } from '@/components/task/TaskHistorySection';
import { priorityColors, statusColors, formatDate } from '@/lib/taskHelpers';

interface TaskDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
}

const TaskDetailsDialogBase = ({ open, onOpenChange, task }: TaskDetailsDialogProps) => {
  // TODO: Réactiver quand useTaskDetails sera créé
  // const {
  //   taskDetails,
  //   loading,
  //   department,
  //   subtasks,
  //   comments,
  //   risks,
  //   dependencies,
  //   totalEffort,
  //   participants
  // } = useTaskDetails(task?.id);

  // Données temporaires en attendant le hook
  const loading = false;
  const taskDetails = null;
  const department = null;
  const subtasks = [];
  const comments = [];
  const risks = [];
  const dependencies = [];
  const totalEffort = 0;
  const participants = [];

  if (!task) return null;

  const isSubtask = (task.task_level || 0) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">#{task.display_order}</span>
            <span>{task.title}</span>
            <Badge className={priorityColors[task.priority]} variant="outline">
              {task.priority}
            </Badge>
            <Badge className={statusColors[task.status]} variant="outline">
              {task.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh] pr-4">
          <div className="space-y-6">
            {/* Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Informations générales
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Responsable:</span>
                    <span>{task.assignee}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Début:</span>
                    <span>{formatDate(task.start_date)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Échéance:</span>
                    <span>{formatDate(task.due_date)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Effort estimé:</span>
                    <span>{task.effort_estimate_h}h</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Progression: {task.progress}%</span>
                    </div>
                    <Progress value={task.progress} className="w-full" />
                  </div>
                  {taskDetails?.budget && (
                    <div className="flex items-center gap-3">
                      <Euro className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Budget:</span>
                      <span>{taskDetails?.budget}€</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Département */}
            {department && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Département
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg bg-muted p-3">
                    <p className="font-medium">{department.name}</p>
                    {department.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{department.description}</p>
                    )}
                    {department.budget && (
                      <div className="mt-2 flex items-center gap-2">
                        <Euro className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Budget: {department.budget}€</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description et critères */}
            {(taskDetails?.description || taskDetails?.acceptance_criteria) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5" />
                    Description et critères
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {taskDetails?.description && (
                    <div>
                      <h4 className="mb-2 font-medium">Description</h4>
                      <p className="rounded-lg bg-muted p-3 text-sm">{taskDetails?.description}</p>
                    </div>
                  )}
                  {taskDetails?.acceptance_criteria && (
                    <div>
                      <h4 className="mb-2 font-medium">Critères d'acceptation</h4>
                      <p className="rounded-lg bg-muted p-3 text-sm">
                        {taskDetails?.acceptance_criteria}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions et sous-tâches */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  Actions et sous-tâches
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.task_actions && task.task_actions.length > 0 && (
                  <div>
                    <h4 className="mb-3 font-medium">Actions ({task.task_actions.length})</h4>
                    <div className="space-y-2">
                      {task.task_actions.map(action => (
                        <div
                          key={action.id}
                          className="flex items-center gap-3 rounded-lg bg-muted p-2"
                        >
                          <div
                            className={`h-3 w-3 rounded-full ${action.is_done ? 'bg-green-500' : 'bg-gray-300'}`}
                          />
                          <span
                            className={action.is_done ? 'text-muted-foreground line-through' : ''}
                          >
                            {action.title}
                          </span>
                          <Badge variant="outline" className="ml-auto">
                            {action.weight_percentage}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {subtasks && subtasks.length > 0 && (
                  <div>
                    <h4 className="mb-3 font-medium">Sous-tâches ({subtasks.length})</h4>
                    <div className="space-y-2">
                      {subtasks.map(subtask => (
                        <div
                          key={subtask.id}
                          className="flex items-center gap-3 rounded-lg bg-muted p-2"
                        >
                          <Badge className={statusColors[subtask.status]} variant="outline">
                            {subtask.status}
                          </Badge>
                          <span>{subtask.title}</span>
                          <div className="ml-auto flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {subtask.effort_estimate_h}h
                            </span>
                            <Progress value={subtask.progress} className="w-16" />
                            <span className="text-sm">{subtask.progress}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Statistiques */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Statistiques
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{totalEffort}h</div>
                  <div className="text-sm text-muted-foreground">Effort total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{subtasks?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Sous-tâches</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{participants?.length || 1}</div>
                  <div className="text-sm text-muted-foreground">Participants</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {task.task_actions?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Actions</div>
                </div>
              </CardContent>
            </Card>

            {/* Participants */}
            {participants && participants.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Équipe ({participants.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {participants.map((participant, index) => (
                      <div key={index} className="flex items-center gap-2 rounded-lg bg-muted p-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{participant.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{participant}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dépendances */}
            {dependencies && dependencies.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link className="h-5 w-5" />
                    Dépendances ({dependencies.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dependencies.map(dep => (
                      <div key={dep.id} className="flex items-center gap-3 rounded-lg bg-muted p-2">
                        <Badge variant="outline">{dep.dependency_type}</Badge>
                        <span>{dep.depends_on_task_title}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Risques */}
            {risks && risks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Risques identifiés ({risks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {risks.map(risk => (
                      <div key={risk.id} className="rounded-lg border p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <Badge variant="destructive">{risk.impact}</Badge>
                          <Badge variant="outline">{risk.probability}</Badge>
                          <Badge variant="secondary">{risk.status}</Badge>
                        </div>
                        <p className="mb-2 text-sm">{risk.risk_description}</p>
                        {risk.mitigation_plan && (
                          <p className="text-sm text-muted-foreground">
                            <strong>Plan d'atténuation:</strong> {risk.mitigation_plan}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Commentaires */}
            {comments && comments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Commentaires récents ({comments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {comments.map(comment => (
                      <div key={comment.id} className="border-l-2 border-primary pl-4">
                        <div className="mb-1 flex items-center gap-2">
                          <Badge variant="outline">{comment.comment_type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Historique des modifications */}
            <TaskHistorySection taskId={task.id} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
// 🎨 Export avec support mobile automatique + thème Tasks
export const TaskDetailsDialog = withUniversalDialog('tasks', TaskDetailsDialogBase);
