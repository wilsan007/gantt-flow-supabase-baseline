import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar, 
  Users, 
  Target, 
  DollarSign, 
  Activity,
  Clock
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'en_cours' | 'a_venir' | 'termine';
  start_date: string;
  end_date: string;
  progress: number;
  manager: string;
  team_members: string[];
  skills_required: string[];
  budget?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
}

interface ProjectDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
}

export const ProjectDetailsDialog: React.FC<ProjectDetailsDialogProps> = ({
  open,
  onOpenChange,
  project
}) => {
  if (!project) return null;

  const getStatusBadge = (status: Project['status']) => {
    const statusConfig = {
      'en_cours': { label: 'En cours', color: 'bg-blue-500' },
      'a_venir': { label: 'À venir', color: 'bg-gray-500' },
      'termine': { label: 'Terminé', color: 'bg-green-500' }
    };
    return statusConfig[status];
  };

  const getPriorityBadge = (priority: Project['priority']) => {
    const priorityConfig = {
      'low': { label: '🟢 Faible', color: 'bg-green-100 text-green-800' },
      'medium': { label: '🟡 Moyenne', color: 'bg-yellow-100 text-yellow-800' },
      'high': { label: '🟠 Élevée', color: 'bg-orange-100 text-orange-800' },
      'urgent': { label: '🔴 Urgente', color: 'bg-red-100 text-red-800' }
    };
    return priorityConfig[priority];
  };

  const mockHistory = [
    { date: '2024-03-15', action: 'Tâche "Interface utilisateur" mise à jour', user: 'AW' },
    { date: '2024-03-14', action: 'Sous-tâche "Design système" terminée', user: 'SM' },
    { date: '2024-03-13', action: 'Action "Tests unitaires" ajoutée', user: 'JD' },
    { date: '2024-03-12', action: 'Projet mis à jour - Budget modifié', user: 'AW' }
  ];

  const statusBadge = getStatusBadge(project.status);
  const priorityBadge = getPriorityBadge(project.priority);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Détails du Projet: {project.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations Générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className={statusBadge.color}>{statusBadge.label}</Badge>
                <Badge className={priorityBadge.color}>{priorityBadge.label}</Badge>
              </div>
              
              <p className="text-muted-foreground">{project.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Manager: {project.manager}</span>
                </div>
                
                {project.budget && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Budget: {project.budget.toLocaleString()} €</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Progression: {project.progress}%</span>
                </div>
              </div>
              
              <div>
                <Progress value={project.progress} className="w-full" />
              </div>
            </CardContent>
          </Card>

          {/* Équipe */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Équipe du Projet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {project.team_members.map((member) => (
                  <Badge key={member} variant="outline">
                    {member}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Compétences requises */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Compétences Requises</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {project.skills_required.map((skill) => (
                  <Badge key={skill} className="bg-primary/10 text-primary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Historique des modifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Historique des Modifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockHistory.map((entry, index) => (
                  <div key={index} className="flex items-start gap-3 pb-3 border-b border-border/50 last:border-b-0">
                    <Badge variant="outline" className="text-xs">
                      {entry.user}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm">{entry.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
