import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Eye, Edit, Trash2, FolderOpen } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { ProjectCreationDialog } from './ProjectCreationDialog';
import { ProjectDetailsDialog } from './ProjectDetailsDialog';
import { AllProjectsView } from './AllProjectsView';

export const ProjectManagement = () => {
  const { projects, loading, error, createProject } = useProjects();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showAllProjects, setShowAllProjects] = useState(false);

  // Si on veut voir tous les projets, afficher la vue dédiée
  if (showAllProjects) {
    return <AllProjectsView onBack={() => setShowAllProjects(false)} />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-6 w-6" />
              Gestion des Projets
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Projet
              </Button>
              <Button variant="outline" onClick={() => setShowAllProjects(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Voir Tous
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-semibold">{project.name}</h3>
                    <Badge>{project.status}</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Manager: {project.manager_name || 'Non assigné'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Département: {project.department_name || 'Aucun'}</span>
                    </div>
                    
                    <div className="flex gap-1">
                      {(project.skills_required || []).slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {(project.skills_required || []).length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{(project.skills_required || []).length - 3}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Progress value={project.progress || 0} className="flex-1" />
                      <span className="text-sm font-medium">{project.progress || 0}%</span>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      📝 {project.task_count || 0} tâche{(project.task_count || 0) > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
