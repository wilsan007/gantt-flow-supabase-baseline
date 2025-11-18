import React, { useState, useRef } from 'react';
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
  project_id?: string;
  project_name?: string;
  progress: number;
  assignee: string | { full_name: string } | null;
  status: string;
}

interface ProjectTableViewProps {
  projects: Project[];
  tasks: Task[];
}

export const ProjectTableView: React.FC<ProjectTableViewProps> = ({ projects, tasks }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const tasksScrollRef = useRef<HTMLDivElement>(null);

  const getTasksForProject = (projectId: string) => {
    return tasks.filter(task => task.project_id === projectId);
  };

  // Fonction pour scroller vers les tâches d'un projet
  const scrollToProjectTasks = (projectId: string) => {
    setSelectedProjectId(projectId);

    // Trouver l'élément des tâches du projet
    const projectTasksElement = document.getElementById(`project-tasks-${projectId}`);
    if (projectTasksElement && tasksScrollRef.current) {
      // Calculer la position relative dans le conteneur
      const containerTop = tasksScrollRef.current.offsetTop;
      const elementTop = projectTasksElement.offsetTop;

      // Scroller vers l'élément
      tasksScrollRef.current.scrollTo({
        top: elementTop - containerTop - 20, // -20 pour un peu d'espace
        behavior: 'smooth',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      planning: { label: 'Planification', color: 'bg-gray-500 text-white' },
      active: { label: 'En cours', color: 'bg-blue-500 text-white' },
      completed: { label: 'Terminé', color: 'bg-green-500 text-white' },
      on_hold: { label: 'En pause', color: 'bg-yellow-500 text-white' },
    };
    return (
      statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'bg-gray-500' }
    );
  };

  const getAssigneeName = (assignee: string | { full_name: string } | null): string => {
    if (!assignee) return 'Non assigné';
    if (typeof assignee === 'string') return assignee;
    return assignee.full_name || 'Non assigné';
  };

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="border-border/50 overflow-hidden rounded-lg border"
    >
      {/* Panel gauche - Projets */}
      <ResizablePanel defaultSize={40} minSize={30}>
        <div className="bg-background h-full border-r">
          <div className="bg-muted/50 border-b p-4">
            <h3 className="text-lg font-semibold">📁 Projets</h3>
          </div>
          <div className="max-h-[600px] space-y-3 overflow-y-auto p-4">
            {projects.map((project, projectIndex) => {
              const statusBadge = getStatusBadge(project.status);
              const projectTasks = getTasksForProject(project.id);
              const isSelected = selectedProjectId === project.id;

              return (
                <Card
                  key={project.id}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary ring-primary shadow-lg ring-2'
                      : 'hover:border-primary/50 hover:shadow-md'
                  }`}
                  onClick={() => scrollToProjectTasks(project.id)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Nom et statut du projet */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="bg-primary/20 text-primary rounded px-2 py-1 text-sm font-bold">
                            #{projectIndex + 1}
                          </span>
                          <h4
                            className="text-primary text-lg font-bold"
                            style={{ fontSize: '1.1rem' }}
                          >
                            {project.name}
                          </h4>
                        </div>
                        <Badge className={statusBadge.color}>{statusBadge.label}</Badge>
                      </div>

                      {/* Informations du projet */}
                      <div className="space-y-2">
                        <div className="text-muted-foreground text-sm">
                          Manager: {project.manager}
                        </div>

                        <div className="flex items-center gap-2">
                          <Progress value={project.progress} className="flex-1" />
                          <span className="text-sm font-medium">{project.progress}%</span>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {project.skills.slice(0, 3).map(skill => (
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

                        <div className="text-muted-foreground text-xs">
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
        <div className="bg-background h-full">
          <div className="bg-muted/50 border-b p-4">
            <h3 className="text-lg font-semibold">📝 Tâches Associées</h3>
            <p className="text-muted-foreground mt-1 text-xs">
              Cliquez sur un projet à gauche pour voir ses tâches
            </p>
          </div>
          <div ref={tasksScrollRef} className="max-h-[600px] space-y-4 overflow-y-auto p-4">
            {projects.map((project, projectIndex) => {
              const projectTasks = getTasksForProject(project.id);
              const isSelected = selectedProjectId === project.id;

              if (projectTasks.length === 0) return null;

              return (
                <div
                  key={project.id}
                  id={`project-tasks-${project.id}`}
                  className={`space-y-2 transition-all ${
                    isSelected ? 'bg-primary/5 ring-primary/30 rounded-lg p-3 ring-2' : ''
                  }`}
                >
                  {/* Nom du projet en en-tête */}
                  <div
                    className={`flex items-center gap-2 border-b pb-1 font-bold ${
                      isSelected ? 'border-primary text-primary' : 'border-border text-primary'
                    }`}
                    style={{
                      fontSize: '1.1rem',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                    }}
                  >
                    <span className="bg-primary/20 text-primary rounded px-2 py-0.5 text-sm font-bold">
                      #{projectIndex + 1}
                    </span>
                    📁 {project.name}
                    {isSelected && (
                      <span className="text-primary/70 ml-2 text-xs font-normal">
                        ← Projet sélectionné
                      </span>
                    )}
                  </div>

                  {/* Tâches du projet */}
                  <div className="space-y-2 pl-4">
                    {projectTasks.map(task => (
                      <Card key={task.id} className="border-l-primary/30 border-l-4">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium">{task.title}</h5>
                              <div className="text-muted-foreground text-sm">
                                Assigné à: {getAssigneeName(task.assignee)}
                              </div>
                            </div>
                            <div className="space-y-1 text-right">
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

            {tasks.filter(task => !task.project_id || !projects.some(p => p.id === task.project_id))
              .length > 0 && (
              <div className="space-y-2">
                <div className="text-muted-foreground border-b pb-1 font-bold">
                  📝 Tâches sans projet
                </div>
                <div className="space-y-2 pl-4">
                  {tasks
                    .filter(
                      task => !task.project_id || !projects.some(p => p.id === task.project_id)
                    )
                    .map(task => (
                      <Card key={task.id} className="border-l-muted border-l-4">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium">{task.title}</h5>
                              <div className="text-muted-foreground text-sm">
                                Assigné à: {getAssigneeName(task.assignee)}
                              </div>
                            </div>
                            <div className="space-y-1 text-right">
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
