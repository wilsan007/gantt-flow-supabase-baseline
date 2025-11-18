import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users } from 'lucide-react';
import { ProjectRow } from './ProjectRow';

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
