import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Flag,
  Tag,
  Plus,
  X,
  FileText,
  Building2,
  FolderKanban,
  UserPlus,
} from '@/lib/icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TaskPropertiesProps {
  status: 'todo' | 'doing' | 'blocked' | 'done';
  setStatus: (status: 'todo' | 'doing' | 'blocked' | 'done') => void;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  dueDate: Date | undefined;
  setDueDate: (date: Date | undefined) => void;
  effortEstimate: number;
  setEffortEstimate: (effort: number) => void;
  assignee: string;
  setAssignee: (assignee: string) => void;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  setPriority: (priority: 'low' | 'medium' | 'high' | 'urgent') => void;
  department: string;
  setDepartment: (dept: string) => void;
  project: string;
  setProject: (proj: string) => void;
  tags: string[];
  newTag: string;
  setNewTag: (tag: string) => void;
  addTag: () => void;
  removeTag: (tag: string) => void;
  availableAssignees: Array<{ id: string; name: string; email: string }>;
  availableDepartments: string[];
  availableProjects: Array<{ id: string; name: string }>;
  loadingData: boolean;
  onInviteClick: () => void;
  parentTask?: {
    start_date?: Date;
    due_date?: Date;
  };
}

export const TaskProperties: React.FC<TaskPropertiesProps> = ({
  status,
  setStatus,
  startDate,
  setStartDate,
  dueDate,
  setDueDate,
  effortEstimate,
  setEffortEstimate,
  assignee,
  setAssignee,
  priority,
  setPriority,
  department,
  setDepartment,
  project,
  setProject,
  tags,
  newTag,
  setNewTag,
  addTag,
  removeTag,
  availableAssignees,
  availableDepartments,
  availableProjects,
  loadingData,
  onInviteClick,
  parentTask,
}) => {
  const statusIcons = {
    todo: '📝',
    doing: '⚡',
    blocked: '🚫',
    done: '✅',
  };

  const priorityIcons = {
    low: '🟢',
    medium: '🟡',
    high: '🟠',
    urgent: '🔴',
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Colonne gauche */}
        <div className="space-y-3">
          {/* Statut */}
          <div className="flex items-center gap-3">
            <Label className="text-muted-foreground flex w-32 items-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              Statut
            </Label>
            <Select value={status} onValueChange={(value: any) => setStatus(value)}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">{statusIcons.todo} À faire</SelectItem>
                <SelectItem value="doing">{statusIcons.doing} En cours</SelectItem>
                <SelectItem value="blocked">{statusIcons.blocked} Bloqué</SelectItem>
                <SelectItem value="done">{statusIcons.done} Terminé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date de début */}
          <div className="flex items-center gap-3">
            <Label className="text-muted-foreground flex w-32 items-center gap-2 text-sm">
              <CalendarIcon className="h-4 w-4" />
              Début
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'flex-1 justify-start text-left font-normal',
                    !startDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP', { locale: fr }) : 'Sélectionner'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  disabled={date => (parentTask?.start_date ? date < parentTask.start_date : false)}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Date d'échéance */}
          <div className="flex items-center gap-3">
            <Label className="text-muted-foreground flex w-32 items-center gap-2 text-sm">
              <CalendarIcon className="h-4 w-4" />
              Échéance
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'flex-1 justify-start text-left font-normal',
                    !dueDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'PPP', { locale: fr }) : 'Sélectionner'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                  disabled={date => {
                    if (parentTask?.due_date && date > parentTask.due_date) return true;
                    if (startDate && date < startDate) return true;
                    return false;
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Temps estimé */}
          <div className="flex items-center gap-3">
            <Label className="text-muted-foreground flex w-32 items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              Temps (h)
            </Label>
            <Input
              type="number"
              min="0"
              step="0.5"
              value={effortEstimate || ''}
              onChange={e => setEffortEstimate(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="flex-1"
            />
          </div>
        </div>

        {/* Colonne droite */}
        <div className="space-y-3">
          {/* Assigné */}
          <div className="flex items-center gap-3">
            <Label className="text-muted-foreground flex w-32 items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              Assigné
            </Label>
            <div className="flex flex-1 gap-2">
              <Select value={assignee} onValueChange={setAssignee} disabled={loadingData}>
                <SelectTrigger className="flex-1">
                  <SelectValue
                    placeholder={
                      loadingData
                        ? 'Chargement...'
                        : availableAssignees.length === 0
                          ? 'Aucun employé'
                          : 'Vide'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableAssignees.length === 0 ? (
                    <div className="text-muted-foreground p-2 text-center text-sm">
                      Aucun employé disponible
                    </div>
                  ) : (
                    availableAssignees.map(person => (
                      <SelectItem key={person.id} value={person.id}>
                        <div className="flex flex-col">
                          <span>{person.name}</span>
                          <span className="text-muted-foreground text-xs">{person.email}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onInviteClick}
                title="Inviter un collaborateur"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Priorité */}
          <div className="flex items-center gap-3">
            <Label className="text-muted-foreground flex w-32 items-center gap-2 text-sm">
              <Flag className="h-4 w-4" />
              Priorité
            </Label>
            <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{priorityIcons.low} Faible</SelectItem>
                <SelectItem value="medium">{priorityIcons.medium} Moyenne</SelectItem>
                <SelectItem value="high">{priorityIcons.high} Élevée</SelectItem>
                <SelectItem value="urgent">{priorityIcons.urgent} Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Département */}
          <div className="flex items-center gap-3">
            <Label className="text-muted-foreground flex w-32 items-center gap-2 text-sm">
              <Building2 className="h-4 w-4" />
              Département
            </Label>
            <Select value={department} onValueChange={setDepartment} disabled={loadingData}>
              <SelectTrigger className="flex-1">
                <SelectValue
                  placeholder={
                    loadingData
                      ? 'Chargement...'
                      : availableDepartments.length === 0
                        ? 'Aucun département'
                        : 'Vide'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableDepartments.length === 0 ? (
                  <div className="text-muted-foreground p-2 text-center text-sm">
                    Aucun département disponible
                  </div>
                ) : (
                  availableDepartments.map(dept => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Projet */}
          <div className="flex items-center gap-3">
            <Label className="text-muted-foreground flex w-32 items-center gap-2 text-sm">
              <FolderKanban className="h-4 w-4" />
              Projet
            </Label>
            <Select value={project} onValueChange={setProject} disabled={loadingData}>
              <SelectTrigger className="flex-1">
                <SelectValue
                  placeholder={
                    loadingData
                      ? 'Chargement...'
                      : availableProjects.length === 0
                        ? 'Aucun projet'
                        : 'Vide'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableProjects.length === 0 ? (
                  <div className="text-muted-foreground p-2 text-center text-sm">
                    Aucun projet disponible
                  </div>
                ) : (
                  availableProjects.map(proj => (
                    <SelectItem key={proj.id} value={proj.id}>
                      {proj.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Étiquettes */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Label className="text-muted-foreground flex w-32 items-center gap-2 text-sm">
            <Tag className="h-4 w-4" />
            Étiquettes
          </Label>
          <div className="flex flex-1 flex-wrap gap-2">
            {tags.map(tag => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <X
                  className="hover:text-destructive h-3 w-3 cursor-pointer"
                  onClick={() => removeTag(tag)}
                />
              </Badge>
            ))}
            <div className="flex items-center gap-2">
              <Input
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Ajouter..."
                className="h-7 w-32 text-sm"
              />
              {newTag && (
                <Button size="sm" variant="ghost" onClick={addTag} className="h-7 px-2">
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
