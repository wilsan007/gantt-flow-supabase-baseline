import { useState, useEffect } from "react";
import { Calendar, Clock, User, Building, AlertTriangle, CheckCircle, Target } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { priorityColors, statusColors, formatDate } from "@/lib/taskHelpers";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface TaskDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any | null;
}

export const TaskDetailsDialog = ({ open, onOpenChange, task }: TaskDetailsDialogProps) => {
  const [taskDetails, setTaskDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadTaskDetails = async () => {
    if (!task) return;
    
    setLoading(true);
    try {
      // Charger les détails étendus de la tâche
      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .select(`
          *,
          project:projects(name, description),
          department:departments(name),
          assignee_profile:profiles!tasks_assignee_id_fkey(full_name, avatar_url)
        `)
        .eq("id", task.id)
        .single();

      if (taskError) throw taskError;

      // Charger les dépendances
      const { data: dependencies } = await supabase
        .from("task_dependencies")
        .select(`
          id,
          dependency_type,
          depends_on_task:tasks!task_dependencies_depends_on_task_id_fkey(id, title, status)
        `)
        .eq("task_id", task.id);

      // Charger les tâches dépendantes
      const { data: dependents } = await supabase
        .from("task_dependencies")
        .select(`
          id,
          dependency_type,
          task:tasks!task_dependencies_task_id_fkey(id, title, status)
        `)
        .eq("depends_on_task_id", task.id);

      // Charger les risques
      const { data: risks } = await supabase
        .from("task_risks")
        .select("*")
        .eq("task_id", task.id)
        .order("created_at", { ascending: false });

      // Charger les commentaires récents
      const { data: recentComments } = await supabase
        .from("task_comments")
        .select("*")
        .eq("task_id", task.id)
        .order("created_at", { ascending: false })
        .limit(5);

      // Compter les documents
      const { count: documentsCount } = await supabase
        .from("task_documents")
        .select("*", { count: "exact", head: true })
        .eq("task_id", task.id);

      // Compter les commentaires
      const { count: commentsCount } = await supabase
        .from("task_comments")
        .select("*", { count: "exact", head: true })
        .eq("task_id", task.id);

      setTaskDetails({
        ...taskData,
        project: taskData.project ? (Array.isArray(taskData.project) ? taskData.project[0] : taskData.project) : undefined,
        department: taskData.department ? (Array.isArray(taskData.department) ? taskData.department[0] : taskData.department) : undefined,
        assignee_profile: taskData.assignee_profile ? (Array.isArray(taskData.assignee_profile) ? taskData.assignee_profile[0] : taskData.assignee_profile) : undefined,
        dependencies: dependencies || [],
        dependents: dependents || [],
        risks: risks || [],
        recent_comments: recentComments || [],
        documents_count: documentsCount || 0,
        comments_count: commentsCount || 0,
      });
    } catch (error) {
      console.error("Error loading task details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && task) {
      loadTaskDetails();
    }
  }, [open, task]);

  if (!taskDetails) return null;

  const getRiskColor = (impact: string, probability: string) => {
    const score = (impact === 'high' ? 3 : impact === 'medium' ? 2 : 1) + 
                  (probability === 'high' ? 3 : probability === 'medium' ? 2 : 1);
    if (score >= 5) return 'bg-destructive/10 text-destructive border-destructive/20';
    if (score >= 4) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">
              {taskDetails.display_order}
            </span>
            {taskDetails.title}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="dependencies">Dépendances</TabsTrigger>
            <TabsTrigger value="risks">Risques</TabsTrigger>
            <TabsTrigger value="activity">Activité</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[600px] mt-4">
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Informations générales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {taskDetails.assignee_profile?.full_name || taskDetails.assigned_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{taskDetails.project?.name || 'Aucun projet'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatDate(taskDetails.start_date)} → {formatDate(taskDetails.due_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{taskDetails.effort_estimate_h}h estimées / {taskDetails.effort_spent_h || 0}h passées</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Statut et progression</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className={priorityColors[taskDetails.priority as keyof typeof priorityColors] || ''} variant="outline">
                        {taskDetails.priority}
                      </Badge>
                      <Badge className={statusColors[taskDetails.status as keyof typeof statusColors] || ''} variant="outline">
                        {taskDetails.status}
                      </Badge>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Progression</span>
                        <span className="text-sm font-medium">{taskDetails.progress}%</span>
                      </div>
                      <Progress value={taskDetails.progress} className="h-2" />
                    </div>
                    {taskDetails.budget && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Budget: </span>
                        <span className="font-medium">{taskDetails.budget}€</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {taskDetails.description && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{taskDetails.description}</p>
                  </CardContent>
                </Card>
              )}

              {taskDetails.acceptance_criteria && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Critères d'acceptation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{taskDetails.acceptance_criteria}</p>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{taskDetails.task_actions?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Actions</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{taskDetails.documents_count}</div>
                    <div className="text-sm text-muted-foreground">Documents</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{taskDetails.comments_count}</div>
                    <div className="text-sm text-muted-foreground">Commentaires</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="dependencies" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Dépend de</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {taskDetails.dependencies?.length ? (
                      <div className="space-y-2">
                        {taskDetails.dependencies.map((dep: any) => (
                          <div key={dep.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <span className="text-sm">{dep.depends_on_task.title}</span>
                            <Badge 
                              className={statusColors[dep.depends_on_task.status as keyof typeof statusColors] || ''} 
                              variant="outline"
                            >
                              {dep.depends_on_task.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucune dépendance</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Bloque</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {taskDetails.dependents?.length ? (
                      <div className="space-y-2">
                        {taskDetails.dependents.map((dep: any) => (
                          <div key={dep.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <span className="text-sm">{dep.task.title}</span>
                            <Badge 
                              className={statusColors[dep.task.status as keyof typeof statusColors] || ''} 
                              variant="outline"
                            >
                              {dep.task.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Ne bloque rien</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="risks" className="space-y-4">
              {taskDetails.risks?.length ? (
                <div className="space-y-3">
                  {taskDetails.risks.map((risk: any) => (
                    <Card key={risk.id} className={getRiskColor(risk.impact, risk.probability)}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          {risk.risk_description}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex gap-2">
                          <Badge variant="outline">Impact: {risk.impact}</Badge>
                          <Badge variant="outline">Probabilité: {risk.probability}</Badge>
                          <Badge variant="outline">Statut: {risk.status}</Badge>
                        </div>
                        {risk.mitigation_plan && (
                          <div>
                            <span className="text-xs font-medium">Plan d'atténuation:</span>
                            <p className="text-xs mt-1">{risk.mitigation_plan}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <CheckCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Aucun risque identifié</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Commentaires récents</CardTitle>
                </CardHeader>
                <CardContent>
                  {taskDetails.recent_comments?.length ? (
                    <div className="space-y-3">
                      {taskDetails.recent_comments.map((comment: any) => (
                        <div key={comment.id} className="p-3 bg-muted/50 rounded">
                          <div className="text-xs text-muted-foreground mb-1">
                            {formatDistanceToNow(new Date(comment.created_at), { 
                              addSuffix: true, 
                              locale: fr 
                            })}
                          </div>
                          <div className="text-sm">{comment.content}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucun commentaire</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};