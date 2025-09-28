import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

interface Project {
  id: string;
  name: string;
  status: string; // 'planning', 'active', 'completed', 'on_hold'
  progress: number;
  manager: string;
  skills: string[];
  start_date: string;
  end_date: string;
}

interface Task {
  id: string;
  title: string;
  project_name: string;
  progress: number;
  assignee: string;
  status: string;
}

interface ProjectTableViewProps {
  projects: Project[];
  tasks: Task[];
}

export const ProjectTableView: React.FC<ProjectTableViewProps> = ({ projects, tasks }) => {
  const getTasksForProject = (projectName: string) => {
    return tasks.filter(task => task.project_name === projectName);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'planning': { label: 'Planification', color: 'bg-gray-500 text-white' },
      'active': { label: 'En cours', color: 'bg-blue-500 text-white' },
      'completed': { label: 'Terminé', color: 'bg-green-500 text-white' },
      'on_hold': { label: 'En pause', color: 'bg-yellow-500 text-white' }
    };
    return statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'bg-gray-500' };
  };

  return (
    <ResizablePanelGroup direction="horizontal" className="border rounded-lg border-border/50 overflow-hidden">
      {/* Panel gauche - Projets */}
      <ResizablePanel defaultSize={40} minSize={30}>
        <div className="h-full bg-background border-r">
          <div className="p-4 border-b bg-muted/50">
            <h3 className="font-semibold text-lg">📁 Projets</h3>
          </div>
          <div className="p-4 space-y-3 overflow-y-auto max-h-[600px]">
            {projects.map((project) => {
              const statusBadge = getStatusBadge(project.status);
              const projectTasks = getTasksForProject(project.name);
              
              return (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Nom et statut du projet */}
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-lg text-primary" style={{ fontSize: '1.1rem' }}>
                          {project.name}
                        </h4>
                        <Badge className={statusBadge.color}>
                          {statusBadge.label}
                        </Badge>
                      </div>
                      
                      {/* Informations du projet */}
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">
                          Manager: {project.manager}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Progress value={project.progress} className="flex-1" />
                          <span className="text-sm font-medium">{project.progress}%</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {project.skills.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {project.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{project.skills.length - 3}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          {projectTasks.length} tâche{projectTasks.length > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Panel droit - Tâches */}
      <ResizablePanel defaultSize={60} minSize={40}>
        <div className="h-full bg-background">
          <div className="p-4 border-b bg-muted/50">
            <h3 className="font-semibold text-lg">📝 Tâches Associées</h3>
          </div>
          <div className="p-4 space-y-4 overflow-y-auto max-h-[600px]">
            {projects.map((project) => {
              const projectTasks = getTasksForProject(project.name);
              
              if (projectTasks.length === 0) return null;
              
              return (
                <div key={project.id} className="space-y-2">
                  {/* Nom du projet en en-tête */}
                  <div className="font-bold text-primary border-b pb-1" style={{ 
                    fontSize: '1.1rem',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}>
                    📁 {project.name}
                  </div>
                  
                  {/* Tâches du projet */}
                  <div className="pl-4 space-y-2">
                    {projectTasks.map((task) => (
                      <Card key={task.id} className="border-l-4 border-l-primary/30">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium">{task.title}</h5>
                              <div className="text-sm text-muted-foreground">
                                Assigné à: {task.assignee}
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <Badge variant="outline" className="text-xs">
                                {task.status}
                              </Badge>
                              <div className="flex items-center gap-2">
                                <Progress value={task.progress} className="w-16" />
                                <span className="text-xs font-medium">{task.progress}%</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {tasks.filter(task => !projects.some(p => p.name === task.project_name)).length > 0 && (
              <div className="space-y-2">
                <div className="font-bold text-muted-foreground border-b pb-1">
                  📝 Tâches sans projet
                </div>
                <div className="pl-4 space-y-2">
                  {tasks
                    .filter(task => !projects.some(p => p.name === task.project_name))
                    .map((task) => (
                      <Card key={task.id} className="border-l-4 border-l-muted">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium">{task.title}</h5>
                              <div className="text-sm text-muted-foreground">
                                Assigné à: {task.assignee}
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <Badge variant="outline" className="text-xs">
                                {task.status}
                              </Badge>
                              <div className="flex items-center gap-2">
                                <Progress value={task.progress} className="w-16" />
                                <span className="text-xs font-medium">{task.progress}%</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
