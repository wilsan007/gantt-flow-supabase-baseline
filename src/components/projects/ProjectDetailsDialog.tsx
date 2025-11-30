import { toast } from 'sonner';
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from '@/components/ui/responsive-modal';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Target, DollarSign, Activity, Clock } from 'lucide-react';
import { formatCurrency } from '@/components/common/CurrencySelect';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string; // Peut être n'importe quelle valeur
  start_date?: string;
  end_date?: string;
  progress?: number;
  manager?: string;
  owner_name?: string;
  team_members?: string[];
  skills_required?: string[];
  budget?: number;
  currency?: string;
  priority?: string; // Peut être n'importe quelle valeur
  created_at?: string;
  updated_at?: string;
}

interface ProjectDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
}

export const ProjectDetailsDialog: React.FC<ProjectDetailsDialogProps> = ({
  open,
  onOpenChange,
  project,
}) => {
  if (!project) return null;

  const getStatusBadge = (status?: string) => {
    if (!status) return { label: 'Inconnu', color: 'bg-gray-400' };

    const statusConfig: Record<string, { label: string; color: string }> = {
      en_cours: { label: 'En cours', color: 'bg-blue-500' },
      a_venir: { label: 'À venir', color: 'bg-gray-500' },
      termine: { label: 'Terminé', color: 'bg-green-500' },
      active: { label: 'Actif', color: 'bg-green-500' },
      completed: { label: 'Terminé', color: 'bg-blue-500' },
      planning: { label: 'Planification', color: 'bg-yellow-500' },
    };
    return statusConfig[status] || { label: status, color: 'bg-gray-400' };
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return { label: '⚪ Non défini', color: 'bg-gray-100 text-gray-800' };

    const priorityConfig: Record<string, { label: string; color: string }> = {
      low: { label: '🟢 Faible', color: 'bg-green-100 text-green-800' },
      medium: { label: '🟡 Moyenne', color: 'bg-yellow-100 text-yellow-800' },
      high: { label: '🟠 Élevée', color: 'bg-orange-100 text-orange-800' },
      urgent: { label: '🔴 Urgente', color: 'bg-red-100 text-red-800' },
    };
    return priorityConfig[priority] || { label: priority, color: 'bg-gray-100 text-gray-800' };
  };

  const mockHistory = [
    { date: '2024-03-15', action: 'Tâche "Interface utilisateur" mise à jour', user: 'AW' },
    { date: '2024-03-14', action: 'Sous-tâche "Design système" terminée', user: 'SM' },
    { date: '2024-03-13', action: 'Action "Tests unitaires" ajoutée', user: 'JD' },
    { date: '2024-03-12', action: 'Projet mis à jour - Budget modifié', user: 'AW' },
  ];

  const statusBadge = getStatusBadge(project.status);
  const priorityBadge = getPriorityBadge(project.priority);

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="max-h-[90vh] w-[95vw] max-w-4xl overflow-y-auto p-4 sm:p-6">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Target className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="truncate">Détails du Projet: {project.name}</span>
          </ResponsiveModalTitle>
        </ResponsiveModalHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations Générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={statusBadge.color}>{statusBadge.label}</Badge>
                <Badge className={priorityBadge.color}>{priorityBadge.label}</Badge>
              </div>

              {project.description && (
                <p className="text-muted-foreground text-sm sm:text-base">{project.description}</p>
              )}

              <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
                {project.start_date && project.end_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="text-muted-foreground h-4 w-4" />
                    <span className="text-sm">
                      {new Date(project.start_date).toLocaleDateString()} -{' '}
                      {new Date(project.end_date).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {(project.manager || project.owner_name) && (
                  <div className="flex items-center gap-2">
                    <Users className="text-muted-foreground h-4 w-4" />
                    <span className="text-sm">
                      Manager: {project.manager || project.owner_name}
                    </span>
                  </div>
                )}

                {project.budget && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="text-muted-foreground h-4 w-4" />
                    <span className="text-sm">
                      Budget: {formatCurrency(project.budget, project.currency || 'DJF')}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Activity className="text-muted-foreground h-4 w-4" />
                  <span className="text-sm">Progression: {project.progress ?? 0}%</span>
                </div>
              </div>

              <div>
                <Progress value={project.progress ?? 0} className="w-full" />
              </div>
            </CardContent>
          </Card>

          {/* Équipe */}
          {project.team_members && project.team_members.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Équipe du Projet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {project.team_members.map(member => (
                    <Badge key={member} variant="outline">
                      {member}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Compétences requises */}
          {project.skills_required && project.skills_required.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Compétences Requises</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {project.skills_required.map(skill => (
                    <Badge key={skill} className="bg-primary/10 text-primary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Historique des modifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                Historique des Modifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockHistory.map((entry, index) => (
                  <div
                    key={index}
                    className="border-border/50 flex items-start gap-3 border-b pb-3 last:border-b-0"
                  >
                    <Badge variant="outline" className="text-xs">
                      {entry.user}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm">{entry.action}</p>
                      <p className="text-muted-foreground text-xs">
                        {new Date(entry.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};
