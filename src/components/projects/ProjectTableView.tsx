/**
 * ProjectTableView - Vue tableau des projets
 * Pattern: Data table (Notion/Airtable)
 */

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Users } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  priority: string;
  start_date?: string;
  due_date?: string;
  progress?: number;
  budget?: number;
  owner_id?: string;
  owner_name?: string;
  team_size?: number;
}

interface ProjectTableViewProps {
  projects: Project[];
  loading?: boolean;
  onProjectClick?: (project: Project) => void;
}

const STATUS_COLORS = {
  active: 'bg-green-500',
  planning: 'bg-blue-500',
  on_hold: 'bg-yellow-500',
  completed: 'bg-gray-500',
  cancelled: 'bg-red-500',
};

const PRIORITY_COLORS = {
  low: 'bg-slate-400',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-600',
};

export const ProjectTableView: React.FC<ProjectTableViewProps> = ({
  projects,
  loading,
  onProjectClick,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Chargement des projets...</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-lg font-medium text-muted-foreground">Aucun projet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Créez votre premier projet pour commencer
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Projet</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Priorité</TableHead>
            <TableHead>Responsable</TableHead>
            <TableHead>Échéance</TableHead>
            <TableHead>Progression</TableHead>
            <TableHead>Budget</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow
              key={project.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onProjectClick?.(project)}
            >
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{project.name}</span>
                  {project.description && (
                    <span className="text-xs text-muted-foreground truncate max-w-md">
                      {project.description}
                    </span>
                  )}
                </div>
              </TableCell>

              <TableCell>
                <Badge
                  variant="secondary"
                  className={`${STATUS_COLORS[project.status as keyof typeof STATUS_COLORS] || 'bg-gray-500'} text-white`}
                >
                  {project.status}
                </Badge>
              </TableCell>

              <TableCell>
                <Badge
                  className={`${PRIORITY_COLORS[project.priority as keyof typeof PRIORITY_COLORS] || 'bg-gray-500'} text-white`}
                >
                  {project.priority}
                </Badge>
              </TableCell>

              <TableCell>
                {project.owner_name ? (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{project.owner_name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Non assigné</span>
                )}
              </TableCell>

              <TableCell>
                {project.due_date ? (
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-4 w-4" />
                    {new Date(project.due_date).toLocaleDateString('fr-FR')}
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={project.progress || 0} className="w-20" />
                  <span className="text-sm text-muted-foreground">
                    {project.progress || 0}%
                  </span>
                </div>
              </TableCell>

              <TableCell>
                {project.budget ? (
                  <span className="text-sm font-medium">
                    {project.budget.toLocaleString('fr-FR')} €
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
