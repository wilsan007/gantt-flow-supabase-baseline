import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  History
} from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import { useTaskDetails } from '@/hooks/useTaskDetails';
import { useTaskAuditLogs } from '@/hooks/useTaskAuditLogs';
import { priorityColors, statusColors, formatDate } from '@/lib/taskHelpers';

interface TaskDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
}

export const TaskDetailsDialog = ({ open, onOpenChange, task }: TaskDetailsDialogProps) => {
  const { 
    taskDetails, 
    loading, 
    department, 
    subtasks, 
    comments, 
    risks, 
    dependencies,
    totalEffort,
    participants
  } = useTaskDetails(task?.id);

  const { auditLogs, loading: auditLoading } = useTaskAuditLogs(task?.id);

  if (!task) return null;

  const isSubtask = (task.task_level || 0) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">#{task.display_order}</span>
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
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Progression: {task.progress}%</span>
                    </div>
                    <Progress value={task.progress} className="w-full" />
                  </div>
                  {taskDetails?.budget && (
                    <div className="flex items-center gap-3">
                      <Euro className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Budget:</span>
                      <span>{taskDetails.budget}€</span>
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
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="font-medium">{department.name}</p>
                    {department.description && (
                      <p className="text-sm text-muted-foreground mt-1">{department.description}</p>
                    )}
                    {department.budget && (
                      <div className="flex items-center gap-2 mt-2">
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
                  {taskDetails.description && (
                    <div>
                      <h4 className="font-medium mb-2">Description</h4>
                      <p className="text-sm bg-muted p-3 rounded-lg">{taskDetails.description}</p>
                    </div>
                  )}
                  {taskDetails.acceptance_criteria && (
                    <div>
                      <h4 className="font-medium mb-2">Critères d'acceptation</h4>
                      <p className="text-sm bg-muted p-3 rounded-lg">{taskDetails.acceptance_criteria}</p>
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
                    <h4 className="font-medium mb-3">Actions ({task.task_actions.length})</h4>
                    <div className="space-y-2">
                      {task.task_actions.map((action) => (
                        <div key={action.id} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                          <div className={`h-3 w-3 rounded-full ${action.is_done ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className={action.is_done ? 'line-through text-muted-foreground' : ''}>{action.title}</span>
                          <Badge variant="outline" className="ml-auto">{action.weight_percentage}%</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {subtasks && subtasks.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Sous-tâches ({subtasks.length})</h4>
                    <div className="space-y-2">
                      {subtasks.map((subtask) => (
                        <div key={subtask.id} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                          <Badge className={statusColors[subtask.status]} variant="outline">{subtask.status}</Badge>
                          <span>{subtask.title}</span>
                          <div className="ml-auto flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{subtask.effort_estimate_h}h</span>
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
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <div className="text-2xl font-bold text-primary">{task.task_actions?.length || 0}</div>
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
                      <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded-lg">
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
                    {dependencies.map((dep) => (
                      <div key={dep.id} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
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
                    {risks.map((risk) => (
                      <div key={risk.id} className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="destructive">{risk.impact}</Badge>
                          <Badge variant="outline">{risk.probability}</Badge>
                          <Badge variant="secondary">{risk.status}</Badge>
                        </div>
                        <p className="text-sm mb-2">{risk.risk_description}</p>
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
                    {comments.map((comment) => (
                      <div key={comment.id} className="border-l-2 border-primary pl-4">
                        <div className="flex items-center gap-2 mb-1">
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Historique des modifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {auditLoading ? (
                  <p className="text-sm text-muted-foreground">Chargement de l'historique...</p>
                ) : auditLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune modification enregistrée.</p>
                ) : (
                  <ScrollArea className="h-60">
                    <div className="space-y-3">
                      {auditLogs.map((log, index) => (
                        <div key={log.id}>
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                            <div className="flex-1 space-y-1">
                              <p className="text-sm">{log.description}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {log.user_name && (
                                  <span>par {log.user_name}</span>
                                )}
                                <span>•</span>
                                <span>
                                  {new Date(log.created_at).toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                          {index < auditLogs.length - 1 && (
                            <Separator className="ml-4 mt-3" />
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};