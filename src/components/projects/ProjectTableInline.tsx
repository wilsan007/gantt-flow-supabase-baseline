import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Calendar, DollarSign, User } from 'lucide-react';
import { ProjectRow } from './ProjectRow';
import { useIsMobile } from '@/hooks/use-mobile';

interface Project {
  id: string;
  name: string;
  status: string;
  progress: number;
  manager: string | { full_name: string } | null;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  created_by?: string;
  manager_id?: string;
  [key: string]: any;
}

interface ProjectTableInlineProps {
  projects: Project[];
  onUpdateProject?: (projectId: string, updates: Partial<Project>) => Promise<void> | void;
  onProjectClick?: (project: Project) => void;
  selectedProjectId?: string;
  compactMode?: boolean;
}

export const ProjectTableInline: React.FC<ProjectTableInlineProps> = ({
  projects,
  onUpdateProject,
  onProjectClick,
  selectedProjectId,
  compactMode = false,
}) => {
  const isMobile = useIsMobile();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'on_hold':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getManagerName = (manager: string | { full_name: string } | null) => {
    if (!manager) return 'Non assigné';
    if (typeof manager === 'string') return manager;
    return manager.full_name || 'Non assigné';
  };

  if (isMobile) {
    return (
      <div className="space-y-3">
        {projects.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center">
            <Users className="h-8 w-8" />
            <p>Aucun projet trouvé</p>
          </div>
        ) : (
          projects.map(project => (
            <Card
              key={project.id}
              className={`cursor-pointer transition-all active:scale-[0.98] ${
                selectedProjectId === project.id ? 'border-primary ring-primary/20 ring-2' : ''
              }`}
              onClick={() => onProjectClick?.(project)}
            >
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-base font-semibold">{project.name}</h4>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge
                        variant={getStatusColor(project.status)}
                        className="px-1.5 py-0 text-xs"
                      >
                        {project.status}
                      </Badge>
                      {project.end_date && (
                        <span className="text-muted-foreground flex items-center gap-1 text-xs">
                          <Calendar className="h-3 w-3" />
                          {formatDate(project.end_date)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold">{project.progress}%</span>
                  </div>
                </div>

                <Progress value={project.progress} className="h-1.5" />

                <div className="text-muted-foreground grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    <span className="truncate">{getManagerName(project.manager)}</span>
                  </div>
                  {project.budget && (
                    <div className="flex items-center justify-end gap-1.5">
                      <DollarSign className="h-3.5 w-3.5" />
                      <span>{formatCurrency(project.budget)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Nom du Projet</TableHead>
            <TableHead className="w-[150px]">Statut</TableHead>
            <TableHead className="w-[120px]">Progression</TableHead>
            <TableHead className="w-[150px]">Chef de Projet</TableHead>
            <TableHead className="w-[150px]">Budget</TableHead>
            {!compactMode && (
              <>
                <TableHead className="w-[120px]">Début</TableHead>
                <TableHead className="w-[120px]">Fin</TableHead>
              </>
            )}
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={compactMode ? 6 : 8} className="h-24 text-center">
                <div className="text-muted-foreground flex flex-col items-center gap-2">
                  <Users className="h-8 w-8" />
                  <p>Aucun projet trouvé</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            projects.map(project => (
              <ProjectRow
                key={project.id}
                project={project}
                onUpdateProject={onUpdateProject}
                onProjectClick={onProjectClick}
                isSelected={selectedProjectId === project.id}
                compactMode={compactMode}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
